package studio.zerotohand.design;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Build;
import android.os.Bundle;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.util.Base64;
import java.io.*;
import java.util.Collections;

/** Offline editor. The native container owns system-bar and keyboard safe areas. */
public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private byte[] pending;
    private static final int OPEN = 41, SAVE = 42;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(247, 246, 249));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(247, 246, 249));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        configureSafeArea(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!isLocal(uri)) return response(403, "Blocked");
                String path = uri.getPath().replaceFirst("^/", "");
                if (path.isEmpty()) path = "index.html";
                if (path.contains("..") || path.contains("\\")) return response(403, "Blocked");
                try { return new WebResourceResponse(mime(path), "UTF-8", getAssets().open(path)); }
                catch (IOException error) { return response(404, "Not Found"); }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(intent, OPEN); }
                catch (ActivityNotFoundException error) { chooser.onReceiveValue(null); chooser = null; }
                return true;
            }
        });
        web.addJavascriptInterface(new SaveBridge(), "ZTHAndroid");
        web.loadUrl("https://zth.local/index.html");
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
            android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
    }

    private void configureSafeArea(FrameLayout root) {
        // Apply all insets once, outside the WebView, including landscape cutouts.
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            getWindow().getInsetsController().setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
        } else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                    | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            }
            int left = insets.getSystemWindowInsetLeft(), right = insets.getSystemWindowInsetRight();
            int top = insets.getSystemWindowInsetTop(), bottom = insets.getSystemWindowInsetBottom();
            if (insets.getDisplayCutout() != null) {
                left = Math.max(left, insets.getDisplayCutout().getSafeInsetLeft());
                right = Math.max(right, insets.getDisplayCutout().getSafeInsetRight());
                top = Math.max(top, insets.getDisplayCutout().getSafeInsetTop());
                bottom = Math.max(bottom, insets.getDisplayCutout().getSafeInsetBottom());
            }
            view.setPadding(left, top, right, bottom);
            return insets.consumeSystemWindowInsets();
        });
        root.requestApplyInsets();
    }

    private boolean isLocal(Uri uri) { return "https".equals(uri.getScheme()) && "zth.local".equals(uri.getHost()); }
    private WebResourceResponse response(int code, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", code, reason,
            Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private String mime(String path) {
        if (path.endsWith(".mjs") || path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".webp")) return "image/webp";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".woff2")) return "font/woff2";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".pdf")) return "application/pdf";
        if (path.endsWith(".webmanifest")) return "application/manifest+json";
        return "text/html";
    }
    private void saved(boolean success) {
        if (web != null) web.evaluateJavascript("window.ZTHAndroidSaved&&window.ZTHAndroidSaved(" + success + ")", null);
    }
    class SaveBridge {
        @JavascriptInterface public void save(String name, String encoded) {
            try {
                if (name == null || encoded == null || encoded.length() > 100000000) throw new IOException();
                final String safe = name.replaceAll("[\\\\/:*?\"<>|]", "-");
                if (!safe.matches(".*\\.(zthpmsj|png|jpg|svg|pdf)$")) throw new IOException();
                final byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
                runOnUiThread(() -> {
                    if (pending != null) { saved(false); return; }
                    pending = bytes;
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(mime(safe).equals("text/html") ? "application/octet-stream" : mime(safe));
                    intent.putExtra(Intent.EXTRA_TITLE, safe);
                    try { startActivityForResult(intent, SAVE); }
                    catch (ActivityNotFoundException error) { pending = null; saved(false); }
                });
            } catch (Exception error) {
                runOnUiThread(() -> { saved(false); Toast.makeText(MainActivity.this, "无法保存，请减小文件或重试", Toast.LENGTH_LONG).show(); });
            }
        }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == OPEN && chooser != null) {
            if (result != RESULT_OK || data == null) chooser.onReceiveValue(null);
            else if (data.getClipData() != null) {
                Uri[] files = new Uri[data.getClipData().getItemCount()];
                for (int i = 0; i < files.length; i++) files[i] = data.getClipData().getItemAt(i).getUri();
                chooser.onReceiveValue(files);
            } else chooser.onReceiveValue(data.getData() == null ? null : new Uri[]{ data.getData() });
            chooser = null;
        } else if (request == SAVE) {
            byte[] bytes = pending;
            pending = null;
            if (result != RESULT_OK || data == null || data.getData() == null || bytes == null) { saved(false); return; }
            Uri target = data.getData();
            new Thread(() -> {
                boolean success = false;
                try (OutputStream output = getContentResolver().openOutputStream(target)) {
                    if (output == null) throw new IOException();
                    output.write(bytes);
                    success = true;
                } catch (IOException error) { /* Report through the editor callback. */ }
                final boolean done = success;
                runOnUiThread(() -> saved(done));
            }).start();
        }
    }
    private void handleBack() {
        web.evaluateJavascript("(()=>{let d=document.querySelector('dialog[open]');if(d){d.close();return true;}let b=document.body;if(b.classList.contains('show-library')||b.classList.contains('show-properties')){b.classList.remove('show-library','show-properties');return true;}return false;})()", result -> {
            if (!"true".equals(result)) new AlertDialog.Builder(this).setTitle("退出设计器？")
                .setMessage("作品会自动保存到此设备，重要作品建议导出工程备份。")
                .setNegativeButton("继续编辑", null).setPositiveButton("退出", (dialog, which) -> finish()).show();
        });
    }
    @Override public void onBackPressed() { handleBack(); }
    @Override protected void onDestroy() {
        if (chooser != null) chooser.onReceiveValue(null);
        if (web != null) { web.removeJavascriptInterface("ZTHAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }
}
