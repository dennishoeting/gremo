package com.GreMo.GreMoApp.model;

/**
 * DBEvent
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
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
        DELETED,
        DELETEDALL
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
