package com.GreMo.GreMoApp;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.GreMo.GreMoApp.fragments.SettingsFragment;

/**
 * activity for the settings
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class SettingsActivity extends Activity {

    public final Intent data = new Intent();

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Display the fragment as the main content.
        getFragmentManager().beginTransaction()
                .replace(android.R.id.content, new SettingsFragment()).commit();
    }

    @Override
    public void finish() {
        // Activity finished ok, return the data
        setResult(RESULT_OK, data);
        super.finish();
    }

}
