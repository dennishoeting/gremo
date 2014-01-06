package com.gremo.mobilesensorapp.controller;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.model.DBEvent;
import com.gremo.mobilesensorapp.model.TransmissionData;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * database handler that handles all actions with the android internal SQLite database
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */

public class DatabaseController extends SQLiteOpenHelper implements TransmissionData.Observer, DBEvent.Provider {
    private static final int BULK_LIMIT = 100;
    private ArrayList<DBEvent.Observer> observers = new ArrayList<DBEvent.Observer>();
    private static final String SQLITE_MAX_VALUE = "18446744073709551616"; // 2^64
    // All Static variables
    // Database Version
    private static final int DATABASE_VERSION = 1;
    // Database Name
    private static final String DATABASE_NAME = "data.db";
    // Table names
    private static final String TABLE_DATA = "data";

    // Action Table Columns names
    private static final String KEY_ID = "id";
    private static final String METHOD = "method";
    private static final String PATH = "path";
    private static final String POST_FUNCTION_TYPE = "post_func_type";
    private static final String JSON = "json_object";
    private static final String TIMESTAMP = "timestamp_sec";
    private Cursor mCursor;


    private DatabaseController() {
        super(Global.getMainActivity(), DATABASE_NAME, null, DATABASE_VERSION);
    }

    private static DatabaseController instance;

    public static DatabaseController getInstance() {
        if (DatabaseController.instance == null) {
            DatabaseController.instance = new DatabaseController();
        }
        return DatabaseController.instance;
    }

    /**
     * creating the table
     */
    @Override
    public void onCreate(SQLiteDatabase db) {
        String CREATE_DATA_TABLE = "CREATE TABLE " + TABLE_DATA + "("
                + KEY_ID + " INTEGER PRIMARY KEY AUTOINCREMENT,"
                + METHOD + " TEXT,"
                + PATH + " TEXT,"
                + POST_FUNCTION_TYPE + " TEXT,"
                + JSON + " TEXT,"
                + TIMESTAMP + " INTEGER)";

        db.execSQL(CREATE_DATA_TABLE);
        //  db.close();
    }

    /**
     * upgrading databases
     *
     * @param db
     * @param oldVersion
     * @param newVersion
     */
    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Drop older table if existed
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_DATA);

        // Create tables again
        onCreate(db);

    }

    /**
     * adding a new data object to the database
     *
     * @param data the data object that will be added
     */
    private void addData(TransmissionData data) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();

        values.put(JSON, data.getData().toString());
        values.put(METHOD, data.getMethod().toString());
        values.put(PATH, data.getPath());
        values.put(POST_FUNCTION_TYPE, data.getPostFuntionType().toString());
        values.put(TIMESTAMP, Math.floor((double) System.currentTimeMillis() / 1000));   // now

        if (db != null) {
            db.insert(TABLE_DATA, null, values);
        }

        this.mCursor = db.rawQuery("SELECT " + KEY_ID + ", " + TIMESTAMP + " FROM " + TABLE_DATA + " ORDER BY " + KEY_ID + " DESC LIMIT 1", null);
        if (this.mCursor.moveToFirst()) {
            data.setId(Integer.parseInt(this.mCursor.getString(0)));
            data.setTimestamp(new Date((long) this.mCursor.getInt(1) * 1000L));
        }
        this.mCursor.close();

        this.notifyDBEventObservers(new DBEvent(DBEvent.EventType.CREATED, data));
    }

    /**
     * returns single data from the database
     *
     * @param id the action id of the action that will be returned
     * @return the requested action
     */
    private TransmissionData getData(int id) throws JSONException {
        TransmissionData data = null;
        SQLiteDatabase db = this.getReadableDatabase();
        if (db != null) {
            this.mCursor = db.rawQuery("SELECT * FROM " + TABLE_DATA + " WHERE " + KEY_ID + " = " + id, null);
        }
        if (this.mCursor.moveToFirst()) {

            data = new TransmissionData(
                    Integer.parseInt(this.mCursor.getString(0)),
                    TransmissionData.getMethod(this.mCursor.getString(1)),
                    this.mCursor.getString(2),
                    TransmissionData.getPostFuntionType(this.mCursor.getString(3)),
                    new JSONObject(this.mCursor.getString(4)),
                    new Date((long) this.mCursor.getInt(5) * 1000L));
        }
        this.mCursor.close();
        //  db.close();
        return data;
    }

    /**
     * returns all data objects from the database
     *
     * @return a list of all data objects in the db
     */
    public List<TransmissionData> getAllDataObjects() throws JSONException {
        List<TransmissionData> dataList = new ArrayList<TransmissionData>();

        String selectQuery = "SELECT * FROM " + TABLE_DATA;

        SQLiteDatabase db = this.getWritableDatabase();
        if (db != null) {
            this.mCursor = db.rawQuery(selectQuery, null);
        }

        if (this.mCursor.moveToFirst()) {
            do {
                TransmissionData data = new TransmissionData(
                        Integer.parseInt(this.mCursor.getString(0)),
                        TransmissionData.getMethod(this.mCursor.getString(1)),
                        this.mCursor.getString(2),
                        TransmissionData.getPostFuntionType(this.mCursor.getString(3)),
                        new JSONObject(this.mCursor.getString(4)),
                        new Date((long) this.mCursor.getInt(5) * 1000L));
                dataList.add(data);
            } while (this.mCursor.moveToNext());
        }
        this.mCursor.close();
        //  db.close();
        return dataList;
    }

    public TransmissionData getOldestData() {
        TransmissionData data;
        SQLiteDatabase db = this.getReadableDatabase();
        if (db != null) {
            this.mCursor = db.rawQuery("SELECT * FROM " + TABLE_DATA + " ORDER BY " + KEY_ID + " ASC LIMIT 1", null);
        }
        if (this.mCursor != null && this.mCursor.moveToFirst() && this.mCursor.getCount() >= 1) { //move to first??

            JSONObject json = null;
            try {
                json = new JSONObject(this.mCursor.getString(4));
            } catch (JSONException e) {
                e.printStackTrace();
            } finally {
                data = new TransmissionData(
                        Integer.parseInt(this.mCursor.getString(0)),
                        TransmissionData.getMethod(this.mCursor.getString(1)),
                        this.mCursor.getString(2),
                        TransmissionData.getPostFuntionType(this.mCursor.getString(3)),
                        json,
                        new Date((long) this.mCursor.getInt(5) * 1000L));
                this.mCursor.close();
            }

            //    db.close();
            return data;
        }
        if (this.mCursor != null) {
            this.mCursor.close();
        }
        //  db.close();
        return null;
    }

    public TransmissionData getBulk(TransmissionData entryToSend) {
        String selectQuery = "SELECT " + KEY_ID + ", " + JSON + " FROM " + TABLE_DATA
                + " WHERE " + PATH + " = \"" + entryToSend.getPath() + "\""
                + " AND " + METHOD + " = \"" + entryToSend.getMethodString() + "\""
                + " AND " + KEY_ID + " < "
                + "(SELECT " + KEY_ID + " FROM " + TABLE_DATA
                + " WHERE " + PATH + " = \"" + TransmissionData.Interface.ADD_BLUETOOTH + "\""
                + " UNION " + "SELECT " + SQLITE_MAX_VALUE + " as " + KEY_ID
                + " ORDER BY " + KEY_ID + " ASC LIMIT 1)"
                + " LIMIT " + BULK_LIMIT;

        SQLiteDatabase db = this.getWritableDatabase();
        this.mCursor = db.rawQuery(selectQuery, null);

        List<Integer> ids = new ArrayList<Integer>();
        JSONArray data = new JSONArray();

        if (this.mCursor.moveToFirst()) {
            do {
                try {
                    ids.add(this.mCursor.getInt(0));
                    data.put(new JSONObject(this.mCursor.getString(1)));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            } while (this.mCursor.moveToNext());
        }
        this.mCursor.close();

        try {
            return new TransmissionData(ids, entryToSend.getMethod(), entryToSend.getPath(), entryToSend.getPostFuntionType(), data, entryToSend.getTimestamp());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * deleting single data object
     *
     * @param dataId the data object that will be deleted
     */
    public void deleteData(int dataId) {
        Log.d("DatabaseController , deleteData", "daten gelöscht mit id " + dataId);
        SQLiteDatabase db = this.getWritableDatabase();
        try {
            Log.d("DatabaseController.deleteData", "1" + (this.getData(dataId) == null));
            Log.d("DatabaseController.deleteData", "2" + (this.getData(dataId).getData() == null));
            Log.d("gelöschte daten", "" + this.getData(dataId).getData().toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        if (db != null) {
            db.delete(TABLE_DATA, KEY_ID + " = ?",
                    new String[]{String.valueOf(dataId)});
        }
        //  db.close();

        this.notifyDBEventObservers(new DBEvent(DBEvent.EventType.DELETED, new TransmissionData(dataId)));
    }

    @Override
    public void onDBEntryUpdate(TransmissionData data) {
        this.addData(data);
    }

    @Override
    public void registerDBEventObserver(DBEvent.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeDBEventObserver(DBEvent.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyDBEventObservers(DBEvent data) {
        for (DBEvent.Observer observer : this.observers) {
            observer.onDBEventUpdate(data);
        }
    }
}

