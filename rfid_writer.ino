// Store Name + Role into RFID Tag
// Block 2 = Name, Block 4 = Role (STUDENT / LECTURER)

#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN  D3
#define SS_PIN   D4

MFRC522 mfrc522(SS_PIN, RST_PIN);
MFRC522::MIFARE_Key key;

// -------------------------------------------------------
// CHANGE THESE TWO BEFORE WRITING EACH CARD
// -------------------------------------------------------
int blockNum_Name = 2;
int blockNum_Role = 4;

byte nameData[16] = {"Mohammed Taha"}; // Max 16 chars — student/lecturer name
byte roleData[16] = {"STUDENT"};       // Either "STUDENT" or "LECTURER" (or "class_rep", etc.)
// -------------------------------------------------------

byte bufferLen = 18;
byte readNameData[18];
byte readRoleData[18];

MFRC522::StatusCode status;

//------------------------------------------
void WriteDataToBlock(int blockNum, byte blockData[]);
void ReadDataFromBlock(int blockNum, byte readBlockData[]);
//------------------------------------------

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("==============================");
  Serial.println("  RFID Name + Role Writer");
  Serial.println("==============================");
  Serial.print("Name to write : ");
  Serial.println((char*)nameData);
  Serial.print("Role to write : ");
  Serial.println((char*)roleData);
  Serial.println("Scan a card to write...");
}

void loop() {
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial())   return;

  // Print UID
  Serial.println("\n** Card Detected **");
  Serial.print("Card UID:");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();

  // --- Write Name to Block 2 ---
  Serial.println("\n[1] Writing NAME to Block 2...");
  WriteDataToBlock(blockNum_Name, nameData);

  // --- Write Role to Block 4 ---
  Serial.println("\n[2] Writing ROLE to Block 4...");
  WriteDataToBlock(blockNum_Role, roleData);

  // --- Read back Name ---
  Serial.println("\n[3] Reading back NAME from Block 2...");
  ReadDataFromBlock(blockNum_Name, readNameData);

  // --- Read back Role ---
  Serial.println("\n[4] Reading back ROLE from Block 4...");
  ReadDataFromBlock(blockNum_Role, readRoleData);

  // --- Print Results ---
  Serial.println("\n==============================");
  Serial.print("Name stored  : ");
  for (int j = 0; j < 16; j++) Serial.write(readNameData[j]);
  Serial.println();

  Serial.print("Role stored  : ");
  for (int j = 0; j < 16; j++) Serial.write(readRoleData[j]);
  Serial.println();
  Serial.println("==============================");
  Serial.println("Card written! Scan next card.");

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

/****************************************************************************************************
 * WriteDataToBlock()
 ****************************************************************************************************/
void WriteDataToBlock(int blockNum, byte blockData[]) {
  status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockNum, &key, &(mfrc522.uid));

  if (status != MFRC522::STATUS_OK) {
    Serial.print("Auth failed for Write: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println("Auth success");

  status = mfrc522.MIFARE_Write(blockNum, blockData, 16);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Write failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println("Write success");
}

/****************************************************************************************************
 * ReadDataFromBlock()
 ****************************************************************************************************/
void ReadDataFromBlock(int blockNum, byte readBlockData[]) {
  status = mfrc522.PCD_Authenticate(
    MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockNum, &key, &(mfrc522.uid));

  if (status != MFRC522::STATUS_OK) {
    Serial.print("Auth failed for Read: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println("Auth success");

  status = mfrc522.MIFARE_Read(blockNum, readBlockData, &bufferLen);
  if (status != MFRC522::STATUS_OK) {
    Serial.print("Read failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  Serial.println("Read success");
}
