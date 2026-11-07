package com.caldeiraodegaia.app.ui.components.camera

import android.Manifest
import android.content.pm.PackageManager
import android.util.Size
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import coil.compose.AsyncImage
import com.caldeiraodegaia.app.hardware.ScannedBarcodeProduct
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import kotlinx.coroutines.launch
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

private enum class ScannerUiState {
    STARTING,
    SCANNING,
    LOADING,
    FOUND,
    NOT_FOUND,
    NO_PERMISSION
}

/**
 * Equivalente nativo Android de `src/components/items/BarcodeScanner.jsx`.
 * Utiliza **CameraX (`PreviewView` + `ImageAnalysis`)** integrado ao **Google ML Kit Barcode Scanning**.
 */
@Composable
fun BarcodeScannerView(
    onLookupBarcode: suspend (String) -> ScannedBarcodeProduct,
    onResult: (ScannedBarcodeProduct) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val palette = LocalGrimoirePalette.current

    var status by remember { mutableStateOf(ScannerUiState.STARTING) }
    var manualCode by remember { mutableStateOf("") }
    var scannedProduct by remember { mutableStateOf<ScannedBarcodeProduct?>(null) }

    val hasCameraPermission = remember {
        ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) ==
                PackageManager.PERMISSION_GRANTED
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        status = if (granted) ScannerUiState.SCANNING else ScannerUiState.NO_PERMISSION
    }

    LaunchedEffect(Unit) {
        if (hasCameraPermission) {
            status = ScannerUiState.SCANNING
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    fun triggerLookup(code: String) {
        val clean = code.trim()
        if (clean.length < 4) return
        status = ScannerUiState.LOADING
        scope.launch {
            val result = onLookupBarcode(clean)
            scannedProduct = result
            status = if (result.found) ScannerUiState.FOUND else ScannerUiState.NOT_FOUND
        }
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        when (status) {
            ScannerUiState.STARTING -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(palette.modalSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = GrimoireColors.Gold.Light
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Iniciando câmera...", color = palette.modalMuted, fontSize = 13.sp)
                    }
                }
            }

            ScannerUiState.SCANNING -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.Black)
                ) {
                    CameraXBarcodePreview(
                        onBarcodeDetected = { rawValue ->
                            triggerLookup(rawValue)
                        }
                    )

                    // Mira dourada central para o código de barras
                    Box(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .width(210.dp)
                            .height(105.dp)
                            .border(
                                width = 2.dp,
                                color = GrimoireColors.Gold.Bright.copy(alpha = 0.85f),
                                shape = RoundedCornerShape(12.dp)
                            )
                    )

                    Text(
                        text = "Aponte para o código de barras",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 12.sp,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 8.dp)
                    )
                }
            }

            ScannerUiState.LOADING -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(palette.modalSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = GrimoireColors.Gold.Light
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Consultando produto...", color = palette.modalMuted, fontSize = 13.sp)
                    }
                }
            }

            ScannerUiState.FOUND, ScannerUiState.NOT_FOUND -> {
                val prod = scannedProduct
                if (prod != null) {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = palette.modalSurface,
                        border = BorderStroke(1.dp, palette.modalBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (!prod.imageUrl.isNullOrBlank()) {
                                AsyncImage(
                                    model = prod.imageUrl,
                                    contentDescription = prod.name,
                                    contentScale = ContentScale.Fit,
                                    modifier = Modifier
                                        .size(56.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(Color.White)
                                        .padding(4.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Código: ${prod.barcode}",
                                    color = palette.modalMuted,
                                    fontSize = 11.sp
                                )
                                if (status == ScannerUiState.NOT_FOUND) {
                                    Text(
                                        text = "Produto não encontrado no banco de dados.",
                                        color = GrimoireColors.Gems.RunningLow.Mid,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                } else {
                                    Text(
                                        text = prod.name.ifBlank { "—" },
                                        color = palette.modalText,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    if (prod.brand.isNotBlank()) {
                                        Text(
                                            text = prod.brand,
                                            color = palette.modalMuted,
                                            fontSize = 12.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            ScannerUiState.NO_PERMISSION -> {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = palette.modalSurface,
                    border = BorderStroke(1.dp, palette.modalBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Sem acesso à câmera. Conceda permissão ou digite o código manualmente abaixo.",
                            color = palette.modalMuted,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // Busca manual por código de barras
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = manualCode,
                onValueChange = { manualCode = it },
                placeholder = { Text("Ou insira o código manualmente...", fontSize = 12.sp) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp)
            )
            Button(
                onClick = { triggerLookup(manualCode) },
                enabled = manualCode.trim().length >= 4,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
            ) {
                Text("Buscar", color = Color.White, fontSize = 13.sp)
            }
        }

        if (status == ScannerUiState.FOUND || status == ScannerUiState.NOT_FOUND) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onClose,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancelar")
                }
                Button(
                    onClick = { scannedProduct?.let(onResult) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = GrimoireColors.PrimaryPurple)
                ) {
                    Text(
                        text = if (status == ScannerUiState.NOT_FOUND) "Usar código" else "Usar produto",
                        color = Color.White
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalGetImage::class)
@Composable
private fun CameraXBarcodePreview(
    onBarcodeDetected: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val detectedLock = remember { AtomicBoolean(false) }

    val scanner = remember {
        val options = BarcodeScannerOptions.Builder()
            .setBarcodeFormats(
                Barcode.FORMAT_EAN_13,
                Barcode.FORMAT_EAN_8,
                Barcode.FORMAT_UPC_A,
                Barcode.FORMAT_UPC_E,
                Barcode.FORMAT_CODE_128,
                Barcode.FORMAT_CODE_39,
                Barcode.FORMAT_QR_CODE
            )
            .build()
        BarcodeScanning.getClient(options)
    }

    DisposableEffect(Unit) {
        onDispose {
            runCatching { scanner.close() }
            runCatching { cameraExecutor.shutdown() }
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val previewView = PreviewView(ctx).apply {
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
            cameraProviderFuture.addListener({
                val cameraProvider = runCatching { cameraProviderFuture.get() }.getOrNull() ?: return@addListener

                val preview = Preview.Builder().build().also {
                    it.surfaceProvider = previewView.surfaceProvider
                }

                @Suppress("DEPRECATION")
                val imageAnalysis = ImageAnalysis.Builder()
                    .setTargetResolution(Size(1280, 720))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    val mediaImage = imageProxy.image
                    if (mediaImage != null && !detectedLock.get()) {
                        val inputImage = InputImage.fromMediaImage(
                            mediaImage,
                            imageProxy.imageInfo.rotationDegrees
                        )
                        scanner.process(inputImage)
                            .addOnSuccessListener { barcodes ->
                                val raw = barcodes.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue
                                if (raw != null && detectedLock.compareAndSet(false, true)) {
                                    ContextCompat.getMainExecutor(ctx).execute {
                                        onBarcodeDetected(raw)
                                    }
                                }
                            }
                            .addOnCompleteListener {
                                imageProxy.close()
                            }
                    } else {
                        imageProxy.close()
                    }
                }

                runCatching {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                }
            }, ContextCompat.getMainExecutor(ctx))

            previewView
        }
    )
}
