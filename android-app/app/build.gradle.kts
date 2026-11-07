import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

fun loadEnvProperties(): Properties {
    val props = Properties()
    val rootEnv = rootProject.file("../.env")
    if (rootEnv.exists()) {
        rootEnv.readLines().forEach { line ->
            val trimmed = line.trim()
            if (trimmed.isNotEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
                val idx = trimmed.indexOf('=')
                val key = trimmed.substring(0, idx).trim()
                val value = trimmed.substring(idx + 1).trim().removeSurrounding("\"").removeSurrounding("'")
                props[key] = value
            }
        }
    }
    val localProps = rootProject.file("local.properties")
    if (localProps.exists()) {
        localProps.inputStream().use { props.load(it) }
    }
    return props
}

val envProps = loadEnvProperties()
val supabaseUrl = envProps.getProperty("SUPABASE_URL")
    ?: envProps.getProperty("VITE_SUPABASE_URL")
    ?: ""
val supabaseAnonKey = envProps.getProperty("SUPABASE_ANON_KEY")
    ?: envProps.getProperty("VITE_SUPABASE_ANON_KEY")
    ?: ""
val geminiApiKey = envProps.getProperty("GEMINI_API_KEY")
    ?: envProps.getProperty("VITE_GEMINI_API_KEY")
    ?: ""

android {
    namespace = "com.caldeiraodegaia.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.caldeiraodegaia.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
        buildConfigField("String", "GEMINI_API_KEY", "\"$geminiApiKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    debugImplementation(libs.androidx.ui.tooling)

    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.exifinterface)

    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.auth)
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.realtime)
    implementation(libs.supabase.storage)

    implementation(libs.ktor.client.okhttp)
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.serialization.kotlinx.json)

    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.guava.android)

    implementation(libs.mlkit.barcode.scanning)
    implementation(libs.mlkit.text.recognition)

    implementation(libs.coil.compose)
    implementation(libs.coil.svg)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)

    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.test.manifest)
}
