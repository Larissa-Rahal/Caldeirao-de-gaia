package com.caldeiraodegaia.app.di

import android.content.Context
import com.caldeiraodegaia.app.data.local.UserPreferencesRepository
import com.caldeiraodegaia.app.data.repository.AuthRepository
import com.caldeiraodegaia.app.data.repository.HouseRepository
import com.caldeiraodegaia.app.data.repository.InventoryRepository
import com.caldeiraodegaia.app.hardware.BarcodeLookupService
import com.caldeiraodegaia.app.hardware.ReceiptScannerManager

/**
 * Container central de Injeção de Dependência que mantém os escopos equivalentes
 * aos contextos globais `AuthContext` e `HouseContext` e aos serviços de inventário e hardware.
 */
class AppContainer(appContext: Context) {
    val preferencesRepository = UserPreferencesRepository(appContext)
    val authRepository = AuthRepository()
    val houseRepository = HouseRepository(
        authRepository = authRepository,
        preferencesRepository = preferencesRepository
    )
    val inventoryRepository = InventoryRepository(
        authRepository = authRepository,
        houseRepository = houseRepository
    )
    val barcodeLookupService = BarcodeLookupService(inventoryRepository)
    val receiptScannerManager = ReceiptScannerManager(appContext)
}
