package com.GreMo.GreMoApp;


public final class Global {
    private static MainActivity mainActivity = null;
    private static String macAddress;
    private static int userId;

    public static void setMainActivity(MainActivity mainActivity) {
        Global.mainActivity = mainActivity;
    }

    public static MainActivity getMainActivity() {
        return Global.mainActivity;
    }

    public static void setMacAddress(String macAddress) {
        Global.macAddress = macAddress;
    }

    public static String getMacAddress() {
        return Global.macAddress;
    }

    public static void setUserId(int userId) {
        Global.userId = userId;
    }

    public static int getUserId() {
        return Global.userId;
    }
}