package com.gremo.mobilesensorapp.controller;

/**
 * @author Jens
 * @version 1.0, 15.07.13
 */

import android.content.Context;
import android.os.Environment;
import android.util.Log;

import com.gremo.mobilesensorapp.R;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.lang.Thread.UncaughtExceptionHandler;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class GremoExceptionHandler implements UncaughtExceptionHandler {

    private UncaughtExceptionHandler defaultUEH;
    private final String localPath = Environment.getExternalStorageDirectory() + "/GremoCrash/";
    private Context context;


    public GremoExceptionHandler(Context context) {
        this.context = context;
        this.defaultUEH = Thread.getDefaultUncaughtExceptionHandler();
    }

    @Override
    public void uncaughtException(Thread t, Throwable e) {
        Log.d("EXCEPTION , uncaughtException", "caught an uncaught exception");
        final Writer result = new StringWriter();
        final PrintWriter printWriter = new PrintWriter(result);
        e.printStackTrace(printWriter);
        String stacktrace = result.toString();
        printWriter.close();
        DateFormat formatter = new SimpleDateFormat("dd-MM-yyyy HH-mm-ss");
        String date = formatter.format(new Date().getTime());
        String filename = this.context.getString(R.string.app_name) + " " + date + ".stacktrace";

        if (localPath != null) {
            File file = new File(localPath + filename);
            file.getParentFile().mkdirs();
            if (!file.exists())
                try {
                    file.createNewFile();
                } catch (IOException e1) {

                }
            writeToFile(stacktrace, filename);
        }
        defaultUEH.uncaughtException(t, e);
    }

    private void writeToFile(String stacktrace, String filename) {
        Log.d("EXCEPTION , writeToFile", "write exception to file");
        try {
            BufferedWriter bufferedWriter = new BufferedWriter(new FileWriter(localPath + filename));
            bufferedWriter.write(stacktrace);
            bufferedWriter.flush();
            bufferedWriter.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
