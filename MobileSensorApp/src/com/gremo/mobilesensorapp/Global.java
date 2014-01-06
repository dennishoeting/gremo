package com.gremo.mobilesensorapp;


import com.gremo.mobilesensorapp.controller.DatabaseController;

public final class Global {
    private static MainActivity mainActivity = null;
    private static String macAddress;

    public static MainActivity getMainActivity() {
        return mainActivity;
    }

    public static void setMainActivity(MainActivity mainActivity) {
        Global.mainActivity = mainActivity;
    }

    public static String getMacAddress() {
        return macAddress;
    }

    public static void setMacAddress(String macAddress) {
        Global.macAddress = macAddress;
    }
}