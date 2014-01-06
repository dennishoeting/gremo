package com.GreMo.GreMoApp.model;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * TransmissionData object that is sent to the server
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class TransmissionData extends GenericData<JSONObject> {
    private List<Integer> ids;
    private final String path;
    private final PostFuntionType postFuntionType;
    private final Method method;

    public TransmissionData(int id) {
        this(id, null, null, null, null);
    }

    public TransmissionData(Method method, String path, PostFuntionType postFuntionType, JSONObject data) {
        this(-1, method, path, postFuntionType, data);
    }

    public TransmissionData(int id, Method method, String path, PostFuntionType postFuntionType, JSONObject data) {
        super(data);

        this.path = path;
        this.postFuntionType = postFuntionType;
        this.method = method;
        this.ids = new ArrayList<Integer>();
        this.ids.add(id);
    }

    public TransmissionData(List<Integer> ids, Method method, String path, PostFuntionType postFuntionType, JSONArray data) throws JSONException {
        super(new JSONObject().put("bulk", data));

        this.path = path;
        this.postFuntionType = postFuntionType;
        this.method = method;
        this.ids = ids;
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
            case WIFI_PUSHED:
                return "WIFI_PUSHED";
            case ACTION_PUSHED:
                return "ACTION_PUSHED";
            default:
                return "";
        }
    }

    public static TransmissionData.PostFuntionType getPostFuntionType(String postFunctionTypeString) {
        if (postFunctionTypeString.equals("WIFI_PUSHED")) {
            return TransmissionData.PostFuntionType.WIFI_PUSHED;
        } else if (postFunctionTypeString.equals("ACTION_PUSHED")) {
            return PostFuntionType.ACTION_PUSHED;
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

    public Method getMethod() {
        return this.method;
    }

    public enum PostFuntionType {
        WIFI_PUSHED, ACTION_PUSHED, ACTION_ENDED, ACTIONLIST_RETRIEVED, PROFILEDATA_RETRIEVED, LOCATION_PUSHED, MOTON_PUSHED, SEND_BLUETOOTH_DATA, UNKNOWN
    }

    public enum Method {
        POST,
        PUT,
        GET,
        UNKNOWN
    }

    public static class Interface {
        public static final String PUSH_GPS = "/action/:userId/gps";
        public static final String PUSH_WIFI = "/action/:userId/wifi";
        public static final String PUSH_MOTION = "/action/:userId/motion";
        public static final String PUSH_ACTION = "/action/:userId";
        public static final String END_ACTION = "/action/:userId/end";
        public static final String GET_ACTION_LIST = "/action/:userId/list";
        public static final String GET_PROFILE_DATA = "/user/:userId/points";
        public static final String PUSH_BLUETOOTH_DATA = "/action/:userId/bluetooth";
    }

    public interface Observer {
        public void onDBEntryUpdate(TransmissionData data);
    }

    public interface Provider {
        public void registerDBEntryObserver(Observer observer);

        public void removeDBEntryObserver(Observer observer);

        public void notifyDBEntryObservers(TransmissionData data);
    }
}
