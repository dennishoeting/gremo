package com.GreMo.GreMoApp.controller;

/**
 * @author Jens
 * @version 1.0, 15.07.13
 */

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Environment;
import android.os.Looper;
import android.util.Log;

import com.GreMo.GreMoApp.R;

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

    private final String localPath = Environment.getExternalStorageDirectory() + "/GremoCrash/";
    private final String EMAIL = "ma-gremo@informatik.uni-oldenburg.de";
    // private final String EMAIL = "jensrunge@gmail.com";
    String stacktrace;
    private UncaughtExceptionHandler defaultUEH;
    private Context context;
    private String date;

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
        this.stacktrace = result.toString();
        printWriter.close();
        DateFormat formatter = new SimpleDateFormat("dd-MM-yyyy HH-mm-ss");
        this.date = formatter.format(new Date().getTime());
        String filename = this.context.getString(R.string.app_name) + " " + date + ".stacktrace"; //****************

        if (localPath != null) {
            File file = new File(localPath + filename);
            file.getParentFile().mkdirs();
            if (!file.exists())
                try {
                    file.createNewFile();
                } catch (IOException e1) {

                }
            this.writeToFile(stacktrace, filename);
        }

        try {
            final StringBuilder report = new StringBuilder();
            Date curDate = new Date();
            report.append("Error Report collected on : ").append(curDate.toString()).append('\n').append('\n');
            report.append("Informations :").append('\n');
            report.append('\n').append('\n');
            report.append("Stack:\n");
            final Writer result2 = new StringWriter();
            final PrintWriter printWriter2 = new PrintWriter(result2);
            e.printStackTrace(printWriter2);
            report.append(result.toString());
            printWriter.close();
            report.append('\n');
            report.append("**** End of current Report ***");
            sendErrorMail(report);
        } catch (Throwable ignore) {

        }


    }

    public void sendErrorMail(final StringBuilder errorContent) {
        final AlertDialog.Builder builder = new AlertDialog.Builder(context);
        new Thread() {
            @Override
            public void run() {
                Looper.prepare();
                builder.setTitle(R.string.errorTitle);
                builder.create();
                builder.setNegativeButton(R.string.errorCancle, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        System.exit(0);
                    }
                });
                builder.setPositiveButton(R.string.errorReport, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Intent sendIntent = new Intent(Intent.ACTION_SEND);
                        String subject = "Your App crashed! Fix it!";
                        StringBuilder body = new StringBuilder();
                        body.append('\n').append('\n');
                        body.append(errorContent).append('\n').append('\n');
                        sendIntent.setType("message/rfc822");
                        sendIntent.putExtra(Intent.EXTRA_EMAIL, new String[]{EMAIL});
                        sendIntent.putExtra(Intent.EXTRA_TEXT, body.toString());
                        sendIntent.putExtra(Intent.EXTRA_SUBJECT, subject);
                        sendIntent.setType("message/rfc822");
                        context.startActivity(sendIntent);
                        System.exit(0);
                    }
                });
                builder.setMessage(R.string.errorMessage);
                builder.show();
                Looper.loop();
            }
        }.start();
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
