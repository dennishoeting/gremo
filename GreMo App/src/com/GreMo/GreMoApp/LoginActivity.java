package com.GreMo.GreMoApp;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.HTTP;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ExecutionException;

/**
 * Activity which displays a login screen to the user, offering registration as
 * well.
 *
 * @author Jens Runge
 * @version 1.0, 10.05.2013
 */
public class LoginActivity extends Activity {
    // Set the timeout in milliseconds until a connection is established.
    // The default value is zero, that means the timeout is not used.
    private final int timeoutConnection = 3000;
    // Set the default socket timeout (SO_TIMEOUT)
    // in milliseconds which is the timeout for waiting for data.
    private final int timeoutSocket = 5000;


    // http://134.106.56.41:50832
    // http://duemmer.informatik.uni-oldenburg.de:50832
    private final String urlEnd = "/user";
    //private Data data;
    //Server ip
    private final String ip = "http://alfsee.informatik.uni-oldenburg.de:50832";

    /**
     * The default email to populate the email field with.
     */
    private static final String EXTRA_EMAIL = "email";

    //setting
    private SharedPreferences userDetails;
    private Editor userDetailsEdit;

    /**
     * Keep track of the login task to ensure we can cancel it if requested.
     */
    private UserLoginTask mAuthTask = null;

    // Values for email and password at the time of the login attempt.
    private String mEmail;
    private String mPassword;

    // UI references.
    private EditText mEmailView;
    private EditText mPasswordView;
    private View mLoginFormView;
    private View mLoginStatusView;
    private TextView mLoginStatusMessageView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        userDetails = getSharedPreferences("userdetails", 0);
        userDetailsEdit = userDetails.edit();

        // FIXME: NUR ZUM TESTEN DRIN; MUSS RAUS; VERHINDERT DASS MAN SICH EINLOGGGEN MUSS
//        userDetailsEdit.putBoolean("loggedIn", true);
//        userDetailsEdit.commit();
        //

        //if user is allready logged in, start MainActivity
        if (userDetails.getBoolean("loggedIn", false)) {
            Intent intent = new Intent(this, MainActivity.class);
            this.startActivity(intent);
            this.finish();
        }

        setContentView(R.layout.activity_login);

        // Set up the login form.
        mEmail = getIntent().getStringExtra(EXTRA_EMAIL);
        mEmailView = (EditText) findViewById(R.id.email);
        mEmailView.setText(mEmail);

        mPasswordView = (EditText) findViewById(R.id.password);
        mPasswordView
                .setOnEditorActionListener(new TextView.OnEditorActionListener() {
                    @Override
                    public boolean onEditorAction(TextView textView, int id,
                                                  KeyEvent keyEvent) {
                        if (id == R.id.login || id == EditorInfo.IME_NULL) {
                            attemptLogin();
                            return true;
                        }
                        return false;
                    }
                });

        mLoginFormView = findViewById(R.id.login_form);
        mLoginStatusView = findViewById(R.id.login_status);
        mLoginStatusMessageView = (TextView) findViewById(R.id.login_status_message);

        findViewById(R.id.sign_in_button).setOnClickListener(
                new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        attemptLogin();
                    }
                });
        findViewById(R.id.register_button).setOnClickListener(
                new View.OnClickListener() {
                    @Override
                    public void onClick(View view) {
                        String url = "http://www.ma-gremo.de/";
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    }
                });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);
        getMenuInflater().inflate(R.menu.login, menu);
        return true;
    }

    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    void attemptLogin() {
        if (mAuthTask != null) {
            return;
        }

        // Reset errors.
        mEmailView.setError(null);
        mPasswordView.setError(null);

        // Store values at the time of the login attempt.
        mEmail = mEmailView.getText().toString();
        mPassword = mPasswordView.getText().toString();

        boolean cancel = false;
        View focusView = null;

        // Check for a valid password.
        if (TextUtils.isEmpty(mPassword)) {
            mPasswordView.setError(getString(R.string.error_field_required));
            focusView = mPasswordView;
            cancel = true;
        }
        // else if (mPassword.length() < 4) {
        // mPasswordView.setError(getString(R.string.error_invalid_password));
        // focusView = mPasswordView;
        // cancel = true;
        // }

        // Check for a valid email address.
        if (TextUtils.isEmpty(mEmail)) {
            mEmailView.setError(getString(R.string.error_field_required));
            focusView = mEmailView;
            cancel = true;
//        }else if (!mEmail
//                .matches("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]+")) {
//            mEmailView.setError(getString(R.string.error_invalid_email));
//            focusView = mEmailView;
//            cancel = true;
        }

        if (cancel) {
            // There was an error; don't attempt login and focus the first
            // form field with an error.
            focusView.requestFocus();
        } else {
            // Show a progress spinner, and kick off a background task to
            // perform the user login attempt.
            mLoginStatusMessageView.setText(R.string.login_progress_signing_in);
            showProgress(true);
            mAuthTask = new UserLoginTask();
            // mAuthTask.execute((Void) null);
            try {
                if (mAuthTask.execute((Void) null).get()) {
                    Intent intent = new Intent(this, MainActivity.class);
                    this.startActivity(intent);
                    this.finish();
                }
            } catch (InterruptedException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } catch (ExecutionException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }
    }

    /**
     * Shows the progress UI and hides the login form.
     */
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
    private void showProgress(final boolean show) {
        // On Honeycomb MR2 we have the ViewPropertyAnimator APIs, which allow
        // for very easy animations. If available, use these APIs to fade-in
        // the progress spinner.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
            int shortAnimTime = getResources().getInteger(
                    android.R.integer.config_shortAnimTime);

            mLoginStatusView.setVisibility(View.VISIBLE);
            mLoginStatusView.animate().setDuration(shortAnimTime)
                    .alpha(show ? 1 : 0)
                    .setListener(new AnimatorListenerAdapter() {
                        @Override
                        public void onAnimationEnd(Animator animation) {
                            mLoginStatusView.setVisibility(show ? View.VISIBLE
                                    : View.GONE);
                        }
                    });

            mLoginFormView.setVisibility(View.VISIBLE);
            mLoginFormView.animate().setDuration(shortAnimTime)
                    .alpha(show ? 0 : 1)
                    .setListener(new AnimatorListenerAdapter() {
                        @Override
                        public void onAnimationEnd(Animator animation) {
                            mLoginFormView.setVisibility(show ? View.GONE
                                    : View.VISIBLE);
                        }
                    });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            mLoginStatusView.setVisibility(show ? View.VISIBLE : View.GONE);
            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

    String encrypt(String pw) throws UnsupportedEncodingException,
            NoSuchAlgorithmException {

        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.reset();
        byte[] buffer = pw.getBytes();
        md.update(buffer);
        byte[] digest = md.digest();

        String hexStr = "";
        for (byte aDigest : digest) {
            hexStr += Integer.toString((aDigest & 0xff) + 0x100, 16)
                    .substring(1);
        }
        return hexStr;

    }

    /**
     * Represents an asynchronous login/registration task used to authenticate
     * the user.
     */
    public class UserLoginTask extends AsyncTask<Void, Void, Boolean> {
        String userId;

        @Override
        protected Boolean doInBackground(Void... params) {

            HttpParams httpParameters = new BasicHttpParams();
            HttpConnectionParams.setConnectionTimeout(httpParameters,
                    timeoutConnection);
            HttpConnectionParams.setSoTimeout(httpParameters, timeoutSocket);
            // TODO: attempt authentication against a network service.
            HttpClient httpclient = new DefaultHttpClient();
            HttpPut loginPut = new HttpPut(
                    // http://duemmer.informatik.uni-oldenburg.de:60832/login
                    ip + urlEnd);
            loginPut.setParams(httpParameters);

            try {
                JSONObject jsonObject = new JSONObject();

                jsonObject.put("username", mEmail);
                jsonObject.put("password", encrypt(mPassword));

                StringEntity entity = null;
                try {
                    entity = new StringEntity(jsonObject.toString());
                    entity.setContentType(new BasicHeader(HTTP.CONTENT_TYPE, "application/json"));
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                }

                loginPut.setEntity(entity);

                HttpResponse response = httpclient.execute(loginPut);

                int statusCode = response.getStatusLine().getStatusCode();

                switch (statusCode) {

                    case HttpStatus.SC_ACCEPTED:

                        InputStream stream;
                        stream = response.getEntity().getContent();

                        BufferedReader rd = new BufferedReader(
                                new InputStreamReader(stream));
                        String line;

                        while ((line = rd.readLine()) != null) {
                            String[] splitResult = line.split(":"); // –> split on ":"
                            this.userId = splitResult[1].replace("}", "");
                            Log.d("UserId:", line);
                        }
                        int userIdInt = Integer.parseInt(this.userId);
                        userDetailsEdit.clear();
                        userDetailsEdit.putInt("userId", userIdInt);
                        userDetailsEdit.putString("username", mEmail);
                        userDetailsEdit.putString("password", encrypt(mPassword));
                        userDetailsEdit.putBoolean("loggedIn", true);
                        userDetailsEdit.commit();
                        return true;
                    case HttpStatus.SC_UNAUTHORIZED:
                        return false;
                    default:
                        return false;

                }

            } catch (ClientProtocolException e) {
                // TODO Auto-generated catch block
            } catch (IOException e) {
                // TODO Auto-generated catch block
            } catch (NoSuchAlgorithmException e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            } catch (JSONException e) {
                e.printStackTrace();
            }

            return false;
        }

        @Override
        protected void onPostExecute(final Boolean success) {
            mAuthTask = null;
            showProgress(false);

            if (success) {
                finish();
            } else {
                mPasswordView
                        .setError(getString(R.string.error_incorrect_password));
                mPasswordView.requestFocus();
            }
        }

        @Override
        protected void onCancelled() {
            mAuthTask = null;
            showProgress(false);
        }
    }

    @Override
    public void onBackPressed() {
        // parent
        this.finish();
    }

}
