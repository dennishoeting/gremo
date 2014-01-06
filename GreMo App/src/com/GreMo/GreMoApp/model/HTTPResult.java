package com.GreMo.GreMoApp.model;

import org.apache.http.HeaderElement;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.protocol.HTTP;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.text.ParseException;

/**
 * @author Jens Runge
 * @version 1.0, 26.06.13
 */
public class HTTPResult extends GenericData<HttpResponse> {
    private int responseCode;
    private Exception e;
    private TransmissionData request;
    private String responseBodyString;

    public HTTPResult(Exception e) {
        super(null);
        this.e = e;
    }

    public HTTPResult(TransmissionData request, HttpResponse response) {
        super(response);
        this.request = request;
        this.responseCode = response.getStatusLine().getStatusCode();
        this.responseBodyString = this.getResponseBody(response);
    }

    public int getResponseCode() {
        return this.responseCode;
    }

    public TransmissionData getRequest() {
        return this.request;
    }

    public boolean isSuccess() {
        return this.e == null && Math.floor(this.responseCode / 100) == 2;
    }

    public boolean isBadRequest() {
        return this.e == null && Math.floor(this.responseCode / 100) == 4;
    }

    public boolean isException() {
        return this.e != null;
    }

    public Exception getException() {
        return this.e;
    }

    public String getResponseBodyString() {
        return this.responseBodyString;
    }

    // http://thinkandroid.wordpress.com/2009/12/30/getting-response-body-of-httpresponse/
    private String getResponseBody(HttpResponse response) {
        if (this.getData() == null) {
            throw new IllegalArgumentException("Response may not be null. Guess this HTTPResult is an exception...");
        }

        String response_text = null;
        HttpEntity entity = null;
        try {
            entity = response.getEntity();
            if (entity == null) {
                return "";
            }
            response_text = _getResponseBody(entity);
        } catch (ParseException e) {
            e.printStackTrace();
        } catch (IOException e) {
            if (entity != null) {
                try {
                    entity.consumeContent();
                } catch (IOException ignored) {
                }
            }
        }
        return response_text;
    }

    private String _getResponseBody(final HttpEntity entity) throws IOException, ParseException {
        if (entity == null) {
            throw new IllegalArgumentException("HTTP entity may not be null");
        }
        InputStream instream = entity.getContent();
        if (instream == null) {
            return "";
        }
        if (entity.getContentLength() > Integer.MAX_VALUE) {
            throw new IllegalArgumentException(
                    "HTTP entity too large to be buffered in memory");
        }
        String charset = getContentCharSet(entity);
        if (charset == null) {
            charset = HTTP.DEFAULT_CONTENT_CHARSET;
        }
        Reader reader = new InputStreamReader(instream, charset);
        StringBuilder buffer = new StringBuilder();
        try {
            char[] tmp = new char[1024];
            int l;
            while ((l = reader.read(tmp)) != -1) {
                buffer.append(tmp, 0, l);
            }
        } finally {
            reader.close();
        }

        return buffer.toString();
    }

    private String getContentCharSet(final HttpEntity entity) throws ParseException {
        if (entity == null) {
            throw new IllegalArgumentException("HTTP entity may not be null");
        }
        String charset = null;
        if (entity.getContentType() != null) {
            HeaderElement values[] = entity.getContentType().getElements();
            if (values.length > 0) {
                NameValuePair param = values[0].getParameterByName("charset");
                if (param != null) {
                    charset = param.getValue();
                }
            }
        }

        return charset;
    }

    public interface Observer {
        public void onHTTPResultUpdate(HTTPResult data);
    }

    public interface Provider {
        public void registerHTTPResultObserver(Observer observer);

        public void removeHTTPResultObserver(Observer observer);

        public void notifyHTTPResultObservers(HTTPResult data);
    }
}