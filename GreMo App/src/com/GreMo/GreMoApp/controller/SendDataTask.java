package com.GreMo.GreMoApp.controller;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.util.Log;

import com.GreMo.GreMoApp.Global;
import com.GreMo.GreMoApp.model.HTTPResult;
import com.GreMo.GreMoApp.model.TransmissionData;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.HTTP;
import org.json.JSONObject;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;

public class SendDataTask extends AsyncTask<Void, Void, HTTPResult> implements HTTPResult.Provider {
    private static final int TIMEOUT_CONNECTION = 10000;
    private static final int TIMEOUT_SOCKET = 15000;
    private final TransmissionData DATA_TO_SEND;
    private final ArrayList<HTTPResult.Observer> observers = new ArrayList<HTTPResult.Observer>();
    // private String ip = "http://134.106.11.89:50832";
    private final String ip = "http://alfsee.informatik.uni-oldenburg.de:50832";
    // private final String ip = "http://134.106.56.251:50832";

    public SendDataTask(TransmissionData dataToSend) {
        super();
        this.DATA_TO_SEND = dataToSend;
    }

    @Override
    protected HTTPResult doInBackground(Void... params) {
        Log.d("doInBackground", "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ doInBackground");
        if (isOnline() && this.DATA_TO_SEND != null) {
            HttpParams httpParameters = new BasicHttpParams();
            HttpConnectionParams.setConnectionTimeout(httpParameters, TIMEOUT_CONNECTION);
            HttpConnectionParams.setSoTimeout(httpParameters, TIMEOUT_SOCKET);

            String path = this.DATA_TO_SEND.getPath();
            JSONObject jsonObject = this.DATA_TO_SEND.getData();
            HttpClient httpclient = new DefaultHttpClient();
            HttpResponse response = null;
            StringEntity entity = null;
            try {
                entity = new StringEntity(jsonObject.toString());
                entity.setContentType(new BasicHeader(HTTP.CONTENT_TYPE, "application/json"));
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }

            switch (this.DATA_TO_SEND.getMethod()) {
                case POST:
                    HttpPost httpPost = new HttpPost(ip + path);
                    httpPost.setParams(httpParameters);
                    httpPost.setEntity(entity);
                    try {
                        response = httpclient.execute(httpPost);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    break;
                case PUT:
                    HttpPut httpPut = new HttpPut(ip + path);
                    httpPut.setParams(httpParameters);
                    httpPut.setEntity(entity);
                    try {
                        response = httpclient.execute(httpPut);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    break;
                case GET:
                    HttpGet httpGet = new HttpGet(ip + path);
                    httpGet.setParams(httpParameters);
                    try {
                        response = httpclient.execute(httpGet);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    break;
            }

            try {
                if (response != null) {
                    return new HTTPResult(this.DATA_TO_SEND, response);
                } else {
                    return new HTTPResult(new Exception("response == null"));
                }
            } catch (Exception e) {
                return new HTTPResult(e);
            }
        } else {
            return new HTTPResult(new Exception("Not online or no Data"));
        }
    }

    @Override
    protected void onPostExecute(HTTPResult result) {
        this.notifyHTTPResultObservers(result);
    }

    boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) Global.getMainActivity()
                .getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo netInfo = cm.getActiveNetworkInfo();
        return netInfo != null && netInfo.isConnectedOrConnecting();
    }

    @Override
    public void registerHTTPResultObserver(HTTPResult.Observer observer) {
        this.observers.add(observer);
    }

    @Override
    public void removeHTTPResultObserver(HTTPResult.Observer observer) {
        this.observers.remove(observer);
    }

    @Override
    public void notifyHTTPResultObservers(HTTPResult data) {
        for (HTTPResult.Observer observer : this.observers) {
            observer.onHTTPResultUpdate(data);
        }
    }
}

