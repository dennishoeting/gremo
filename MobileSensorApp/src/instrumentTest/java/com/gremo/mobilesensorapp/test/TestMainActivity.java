package instrumentTest.java.com.gremo.mobilesensorapp.test;

import android.test.ActivityInstrumentationTestCase2;
import android.util.Log;

import com.gremo.mobilesensorapp.MainActivity;

/**
 * Created by Jens on 26.06.13.
 */
public class TestMainActivity extends ActivityInstrumentationTestCase2<MainActivity> {

    public TestMainActivity(Class<MainActivity> activityClass) {
        super(activityClass);
    }

    public TestMainActivity() {
        super(MainActivity.class);
    }

    public void tearDown() throws Exception {
    }

    public void testOnCreate() throws Exception {

        Log.d("instrumentTest.java.com.gremo.mobilesensorapp.test.TestMainActivity , tearDown", "");
        assertEquals(true, true);
    }

    public void testOnCreateOptionsMenu() throws Exception {

    }
}
