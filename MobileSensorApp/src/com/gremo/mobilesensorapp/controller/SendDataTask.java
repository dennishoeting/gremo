package com.gremo.mobilesensorapp.controller;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.AsyncTask;

import com.gremo.mobilesensorapp.Global;
import com.gremo.mobilesensorapp.model.HTTPResult;
import com.gremo.mobilesensorapp.model.TransmissionData;

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
    private final TransmissionData DATA_TO_SEND;
    // String ip = "http://134.106.56.41:50832";
    String ip = "http://alfsee.informatik.uni-oldenburg.de:50832";
    private ArrayList<HTTPResult.Observer> observers = new ArrayList<HTTPResult.Observer>();

    public SendDataTask(TransmissionData data) {
        this.DATA_TO_SEND = data;
    }

    @Override
    protected HTTPResult doInBackground(Void... params) {
        if (isOnline() && this.DATA_TO_SEND != null) {
            HttpParams httpParameters = new BasicHttpParams();
            int timeoutConnection = 10000;
            HttpConnectionParams.setConnectionTimeout(httpParameters, timeoutConnection);
            int timeoutSocket = 15000;
            HttpConnectionParams.setSoTimeout(httpParameters, timeoutSocket);

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

