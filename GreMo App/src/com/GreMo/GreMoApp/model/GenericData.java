package com.GreMo.GreMoApp.model;

/**
 * @author Jens Runge
 * @version 1.0, 26.06.13
 */
public abstract class GenericData<K extends Object> {
    private K data;

    GenericData(K data) {
        this.data = data;
    }

    public K getData() {
        return this.data;
    }

    public void setData(K data) {
        this.data = data;
    }
}