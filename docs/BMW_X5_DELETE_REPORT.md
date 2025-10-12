# BMW X5 Delete Report

## 📊 Summary

- **Total Files:** 427
- **Total Size:** 1.2 GB (1,213 MB)
- **Date Generated:** 2025-10-12

## 📁 Directories to Delete

### 1. BlackRent_Official BMW X5
```
2025/08/BlackRent_Official/BMW_X5_-_zalo_ena_C95246/
2025/08/BlackRent_Official/BMW_X5_WS-FIX-TEST/
```

### 2. Miki BMW X5
```
2025/08/Miki/Bmw_X5_-_zalo_ena_C95246/
```

## 📋 File Types Included

- ✅ Handover Protocol PDFs
- ✅ Return Protocol PDFs
- ✅ Vehicle Photos (JPG/PNG)
- ✅ Damage Report Photos
- ✅ Protocol JSON metadata

## 🔍 Sample Files (first 20)

```
2025-08-24 13:35:02     860751 2025/08/BlackRent_Official/BMW_X5_-_zalo_ena_C95246/handover/ab1fc362-5d2a-4bc6-818f-b7a10e21fa50/pdf/Odovzdavaci_Mikail_Pirgozi_BMW_C95246_2025-08-24.pdf
2025-08-27 16:47:32     113932 2025/08/BlackRent_Official/BMW_X5_WS-FIX-TEST/handover/b94034f6-8cf3-4a34-a21c-278fcd9ed257/pdf/Odovzdavaci_Mikail_Pirgozi_WEBSUPPORT_FIX_BMW_WS-FIX-TEST_2025-08-27.pdf
2025-08-27 16:08:51     860983 2025/08/Miki/Bmw_X5_-_zalo_ena_C95246/handover/015f90cd-f9c0-474e-89b5-db690c990bae/pdf/Odovzdavaci_Mikail_Pirgozi_Bmw_C95246_2025-08-27.pdf
... (424 more files)
```

## 🗑️ Delete Commands

### Safe Delete (one directory at a time)

```bash
# Delete BlackRent_Official BMW X5
aws s3 rm s3://blackrent-storage/2025/08/BlackRent_Official/BMW_X5_-_zalo_ena_C95246/ \
  --recursive \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com

# Delete BlackRent_Official BMW X5 WS-FIX-TEST
aws s3 rm s3://blackrent-storage/2025/08/BlackRent_Official/BMW_X5_WS-FIX-TEST/ \
  --recursive \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com

# Delete Miki BMW X5
aws s3 rm s3://blackrent-storage/2025/08/Miki/Bmw_X5_-_zalo_ena_C95246/ \
  --recursive \
  --profile r2 \
  --endpoint-url https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com
```

### OR use helper script

```bash
# Run from project root
./scripts/delete-bmw-x5.sh
```

## ⚠️ WARNING

**THIS ACTION IS IRREVERSIBLE!**

Before deleting:
1. ✅ Backup report created: `/tmp/bmw-x5-files.txt`
2. ✅ Verify you don't need these protocols
3. ✅ Check database references to these files
4. ✅ Confirm with team if needed

## 📦 Backup

Full file list saved to:
```
/tmp/bmw-x5-files.txt
```

## 🔄 Recovery

If needed, contact Cloudflare R2 support within 24 hours for potential recovery.

