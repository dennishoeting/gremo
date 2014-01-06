package com.gremo.mobilesensorapp.model;

/**
 * Created by Jens Runge on 28.06.13.
 */
public class DBEvent extends GenericData<TransmissionData> {
    private EventType type;

    public DBEvent(EventType type, TransmissionData data) {
        super(data);
        this.type = type;
    }

    public EventType getType() {
        return this.type;
    }

    public void setType(EventType type) {
        this.type = type;
    }


    public enum EventType {
        CREATED,
        DELETED
    }

    public interface Observer {
        public void onDBEventUpdate(DBEvent data);
    }

    public interface Provider {
        public void registerDBEventObserver(Observer observer);

        public void removeDBEventObserver(Observer observer);

        public void notifyDBEventObservers(DBEvent data);
    }
}
