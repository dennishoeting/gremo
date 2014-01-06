package com.gremo.mobilesensorapp.model;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * TransmissionData object that is sent to the server
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013/
 */
public class TransmissionData extends GenericData<JSONObject> {
    private List<Integer> ids;
    private String path;
    private PostFuntionType postFuntionType;
    private Method method;
    private Date timestamp;

    public TransmissionData(int id) {
        this(id, null, null, null, null, null);
    }

    public TransmissionData(Method method, String path, PostFuntionType postFuntionType, JSONObject data) {
        this(-1, method, path, postFuntionType, data, null);
    }

    public TransmissionData(int id, Method method, String path, PostFuntionType postFuntionType, JSONObject data, Date timestamp) {
        super(data);

        this.path = path;
        this.postFuntionType = postFuntionType;
        this.method = method;
        this.ids = new ArrayList<Integer>();
        this.ids.add(id);
        this.timestamp = timestamp;
    }

    public TransmissionData(List<Integer> ids, Method method, String path, PostFuntionType postFuntionType, JSONArray data, Date timestamp) throws JSONException {
        super(new JSONObject().put("bulk", data));
        this.timestamp = timestamp;
        this.path = path;
        this.postFuntionType = postFuntionType;
        this.method = method;
        this.ids = ids;
    }

    public static TransmissionData.PostFuntionType getPostFuntionType(String postFunctionTypeString) {
        if (postFunctionTypeString.equals("CREATE_WIFI_SENSOR")) {
            return TransmissionData.PostFuntionType.CREATE_WIFI_SENSOR;
        } else if (postFunctionTypeString.equals("CREATE_BLUETOOTH_SENSOR")) {
            return TransmissionData.PostFuntionType.CREATE_BLUETOOTH_SENSOR;
        } else if (postFunctionTypeString.equals("SEND_BLUETOOTH_DATA")) {
            return TransmissionData.PostFuntionType.SEND_BLUETOOTH_DATA;
        } else {
            return TransmissionData.PostFuntionType.UNKNOWN;
        }
    }

    public static TransmissionData.Method getMethod(String methodString) {
        if (methodString.equals("POST")) {
            return TransmissionData.Method.POST;
        } else if (methodString.equals("PUT")) {
            return TransmissionData.Method.PUT;
        } else if (methodString.equals("GET")) {
            return TransmissionData.Method.GET;
        } else {
            return TransmissionData.Method.UNKNOWN;
        }
    }

    public List<Integer> getIds() {
        return this.ids;
    }

    public void setIds(List<Integer> ids) {
        this.ids = ids;
    }

    public void setId(int id) {
        this.ids = new ArrayList<Integer>();
        this.ids.add(id);
    }

    public String getPath() {
        return this.path;
    }

    public PostFuntionType getPostFuntionType() {
        return this.postFuntionType;
    }

    public Date getTimestamp() {
        return this.timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getMethodString() {
        switch (this.method) {
            case POST:
                return "POST";
            case PUT:
                return "PUT";
            case GET:
                return "GET";
            default:
                return "";
        }
    }

    public String getPostFuntionTypeString() {
        switch (this.postFuntionType) {
            case CREATE_BLUETOOTH_SENSOR:
                return "CREATE_BLUETOOTH_SENSOR";
            case CREATE_WIFI_SENSOR:
                return "CREATE_WIFI_SENSOR";
            case SEND_BLUETOOTH_DATA:
                return "SEND_BLUETOOTH_DATA";
            default:
                return "";
        }
    }

    public Method getMethod() {
        return this.method;
    }

    public enum PostFuntionType {
        CREATE_WIFI_SENSOR,
        CREATE_BLUETOOTH_SENSOR,
        SEND_BLUETOOTH_DATA,
        UNKNOWN
    }

    public enum Method {
        POST,
        PUT,
        GET,
        UNKNOWN
    }

    public interface Observer {
        public void onDBEntryUpdate(TransmissionData data);
    }

    public interface Provider {
        public void registerDBEntryObserver(Observer observer);

        public void removeDBEntryObserver(Observer observer);

        public void notifyDBEntryObservers(TransmissionData data);
    }

    public static class Interface {
        public static final String ADD_BLUETOOTH = "/bluetoothsensor";
        public static final String PUSH_BLUETOOTH_DATA = "/bluetoothsensor/";
        public static final String ADD_WIFI = "/wifisensor";
    }
}
