package com.caldeiraodegaia.app.ui.components.common

import android.content.Context
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.caldeiraodegaia.app.core.util.FormatUtils
import com.caldeiraodegaia.app.ui.theme.GrimoireColors
import com.caldeiraodegaia.app.ui.theme.LocalGrimoirePalette
import kotlinx.coroutines.launch
import java.io.File

/**
 * Equivalente nativo em Jetpack Compose de `src/components/ui/Avatar.jsx`.
 */
@Composable
fun AvatarComposable(
    name: String?,
    imageUrl: String? = null,
    size: Dp = 36.dp,
    modifier: Modifier = Modifier
) {
    val initials = remember(name) { FormatUtils.getInitials(name) }

    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        GrimoireColors.PrimaryPurple,
                        GrimoireColors.Orb.CoreDeep
                    )
                )
            )
            .border(1.dp, GrimoireColors.Gold.Base.copy(alpha = 0.7f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        if (!imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = name ?: "Avatar",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Text(
                text = initials,
                color = GrimoireColors.Gold.Cream,
                fontWeight = FontWeight.Bold,
                fontSize = (size.value * 0.38f).sp
            )
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/ui/Modal.jsx`.
 */
@Composable
fun GrimoireModalDialog(
    open: Boolean,
    onClose: () -> Unit,
    title: String,
    content: @Composable () -> Unit
) {
    if (!open) return
    val palette = LocalGrimoirePalette.current

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .heightIn(max = 720.dp),
            shape = RoundedCornerShape(24.dp),
            color = palette.modalBg,
            border = BorderStroke(1.5.dp, GrimoireColors.Gold.Base.copy(alpha = 0.65f)),
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = title,
                        color = palette.modalText,
                        fontFamily = FontFamily.Serif,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    IconButton(
                        onClick = onClose,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fechar",
                            tint = palette.modalMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                content()
            }
        }
    }
}

/**
 * Equivalente nativo em Jetpack Compose de `src/components/items/ImageUploader.jsx`,
 * suportando captura de foto pela câmera via `FileProvider` e seleção da galeria via Photo Picker.
 */
@Composable
fun ImagePickerBox(
    imageUrl: String,
    onImageChanged: (String) -> Unit,
    onUploadUri: suspend (Context, Uri) -> String,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val palette = LocalGrimoirePalette.current

    var uploading by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }

    fun handleUri(uri: Uri?) {
        if (uri == null) return
        errorText = null
        uploading = true
        scope.launch {
            try {
                val publicUrl = onUploadUri(context, uri)
                onImageChanged(publicUrl)
            } catch (e: Exception) {
                errorText = e.message ?: "Erro ao enviar imagem."
            } finally {
                uploading = false
            }
        }
    }

    val takePictureLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        if (success && pendingCameraUri != null) {
            handleUri(pendingCameraUri)
        }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            val uri = createTempImageUri(context)
            pendingCameraUri = uri
            takePictureLauncher.launch(uri)
        } else {
            errorText = "Permissão de câmera negada."
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        handleUri(uri)
    }

    Column(modifier = modifier.fillMaxWidth()) {
        if (imageUrl.isNotBlank()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(palette.modalSurface)
                    .border(1.dp, palette.modalBorder, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = "Imagem do produto",
                    contentScale = ContentScale.Fit,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp)
                )
                if (uploading) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.5f)),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = GrimoireColors.Gold.Bright,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                } else {
                    IconButton(
                        onClick = { onImageChanged("") },
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(6.dp)
                            .size(28.dp)
                            .background(palette.modalBg.copy(alpha = 0.9f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Remover imagem",
                            tint = Color(0xFFEF4444),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(palette.modalSurface)
                    .border(1.dp, palette.modalBorder, RoundedCornerShape(16.dp))
                    .padding(12.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            cameraPermissionLauncher.launch(android.Manifest.permission.CAMERA)
                        },
                        enabled = !uploading,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Câmera", fontSize = 13.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            galleryLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        enabled = !uploading,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Galeria", fontSize = 13.sp)
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))
                if (uploading) {
                    CircularProgressIndicator(
                        color = GrimoireColors.Gold.Light,
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        text = "JPG, PNG, WebP (máx. 5MB)",
                        color = palette.modalMuted,
                        fontSize = 11.sp
                    )
                }
            }
        }

        if (!errorText.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = errorText!!,
                color = Color(0xFFEF4444),
                fontSize = 12.sp
            )
        }
    }
}

fun createTempImageUri(context: Context): Uri {
    val imagesDir = File(context.cacheDir, "images").apply { mkdirs() }
    val imageFile = File(imagesDir, "capture_${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(
        context,
        "${context.packageName}.fileprovider",
        imageFile
    )
}
