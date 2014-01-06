package com.gremo.mobilesensorapp.model;

/**
 * Created by Jens Runge on 26.06.13.
 */
public abstract class GenericData<K extends Object> {
    private K data;

    public GenericData(K data) {
        this.data = data;
    }

    public K getData() {
        return this.data;
    }

    public void setData(K data) {
        this.data = data;
    }
}