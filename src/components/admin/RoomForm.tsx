"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createRoomAction, updateRoomAction } from "@/features/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { validateImageMetadata, validateImageBytes } from "@/lib/validation";
import type { Room } from "@/features/rooms/queries";
import {
  CameraIcon,
  UploadCloudIcon,
  AlertCircleIcon,
  BuildingIcon,
  UsersIcon,
} from "@/components/ui/Icons";

interface RoomFormProps {
  initialRoom?: Room;
}

export function RoomForm({ initialRoom }: RoomFormProps) {
  const router = useRouter();
  const isEditing = !!initialRoom;

  const [code, setCode] = useState(initialRoom?.code || "");
  const [name, setName] = useState(initialRoom?.name || "");
  const [building, setBuilding] = useState(initialRoom?.building || "");
  const [floor, setFloor] = useState(initialRoom?.floor || "");
  const [capacity, setCapacity] = useState<number | string>(initialRoom?.capacity || 30);
  const [description, setDescription] = useState(initialRoom?.description || "");
  const [isActive, setIsActive] = useState(initialRoom ? initialRoom.is_active : true);

  // Photo state (PRD v1.2 FR-08)
  const [imagePath, setImagePath] = useState<string | null>(initialRoom?.image_path || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    if (initialRoom?.image_path) {
      const supabase = createClient();
      return supabase.storage.from("room-images").getPublicUrl(initialRoom.image_path).data.publicUrl;
    }
    return null;
  });
  const [imageError, setImageError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    // 1. Metadata validation (type and size <= 3 MB)
    const metaCheck = validateImageMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!metaCheck.valid) {
      setImageError(metaCheck.error || "Berkas gambar tidak valid.");
      e.target.value = "";
      return;
    }

    // 2. Magic bytes check
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const byteCheck = validateImageBytes(new Uint8Array(buffer));
      if (!byteCheck.valid) {
        setImageError(byteCheck.error || "Format gambar tidak didukung.");
        e.target.value = "";
        return;
      }
    } catch {
      setImageError("Gagal memeriksa keabsahan berkas gambar.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImagePath(null);
    setImageError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});
    setImageError(null);

    try {
      let finalImagePath = imagePath;

      // 1. If new image file selected, upload to room-images bucket
      if (imageFile) {
        setUploadStatus("Mengunggah foto ruangan...");
        const supabase = createClient();

        const lowerName = imageFile.name.toLowerCase();
        let ext = "jpg";
        if (lowerName.endsWith(".png")) ext = "png";
        else if (lowerName.endsWith(".webp")) ext = "webp";

        const roomFolderId = initialRoom?.id || (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "room");
        const photoId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`;
        const newPath = `rooms/${roomFolderId}/${photoId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("room-images")
          .upload(newPath, imageFile, {
            upsert: true,
            contentType: imageFile.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
          });

        if (uploadError) {
          setImageError(`Gagal mengunggah foto: ${uploadError.message}`);
          setLoading(false);
          setUploadStatus(null);
          return;
        }

        finalImagePath = newPath;
      }

      setUploadStatus("Menyimpan data ruangan...");

      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        building: building.trim(),
        floor: floor.trim(),
        capacity: Number(capacity),
        description: description.trim() || undefined,
        is_active: isActive,
        image_path: finalImagePath,
      };

      const result = isEditing
        ? await updateRoomAction(initialRoom.id, payload)
        : await createRoomAction(payload);

      if (!result.success) {
        setGeneralError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setLoading(false);
        setUploadStatus(null);
        return;
      }

      router.push("/admin/ruangan");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data ruangan.";
      setGeneralError(msg);
      setLoading(false);
      setUploadStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Penyimpanan Gagal:</p>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Card 1: Identitas & Lokasi */}
      <div className="academic-card p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <BuildingIcon className="w-4 h-4 text-blue-700" />
          <span>Identitas & Lokasi Ruangan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="room-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kode Ruangan <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: R-101"
              required
              minLength={2}
              maxLength={30}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">2–30 karakter (A-Z, 0-9, strip).</p>
            {fieldErrors.code && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.code[0]}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="room-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap Ruangan <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ruang Kuliah Teori 101"
              required
              minLength={3}
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.name[0]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="building" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gedung <span className="text-rose-500">*</span>
            </label>
            <input
              id="building"
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Contoh: Gedung Kuliah Bersama A"
              required
              minLength={2}
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            {fieldErrors.building && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.building[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="floor" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lantai <span className="text-rose-500">*</span>
            </label>
            <input
              id="floor"
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Contoh: Lantai 2"
              required
              minLength={1}
              maxLength={30}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            {fieldErrors.floor && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.floor[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Kapasitas & Keterangan */}
      <div className="academic-card p-6 bg-white space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-blue-700" />
          <span>Kapasitas & Fasilitas Ruangan</span>
        </h2>

        <div>
          <label htmlFor="capacity" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kapasitas Peserta (Orang) <span className="text-rose-500">*</span>
          </label>
          <div className="max-w-xs">
            <input
              id="capacity"
              type="number"
              min={1}
              max={1000}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">1–1000 orang.</p>
          {fieldErrors.capacity && (
            <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.capacity[0]}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-700">
              Keterangan / Fasilitas Ruangan (Opsional)
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {description.length} / 500 karakter
            </span>
          </div>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan fasilitas pendukung ruangan (contoh: Proyektor LCD HDMI, sound system wireless, 40 kursi kuliah ber-AC)..."
            maxLength={500}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Card 3: Foto Utama Ruangan (PRD v1.2 FR-08) */}
      <div className="academic-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CameraIcon className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Foto Representatif Ruangan (Opsional)
            </h2>
          </div>
          <span className="text-xs text-slate-400">JPEG, PNG, WebP (Maks. 3 MB)</span>
        </div>

        {previewUrl ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="relative w-44 aspect-video bg-slate-200 rounded-lg overflow-hidden border border-slate-300 shrink-0">
              <Image
                src={previewUrl}
                alt="Preview foto ruangan"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">
                {imageFile ? `Berkas Baru: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)` : "Foto ruangan tersimpan"}
              </p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="change-room-photo"
                  className="cursor-pointer px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Ganti Foto
                </label>
                <input
                  id="change-room-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Hapus Foto
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            htmlFor="room-photo"
            className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
              <UploadCloudIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Pilih foto ruangan untuk diunggah
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Format didukung: JPG, PNG, atau WebP (maks. 3 MB)
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs group-hover:border-blue-300">
              Pilih Berkas Foto
            </span>
            <input
              id="room-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={loading}
              className="sr-only"
            />
          </label>
        )}

        {imageError && (
          <p className="text-xs text-rose-600 font-medium">{imageError}</p>
        )}
      </div>

      {/* Card 4: Status Publikasi */}
      <div className="academic-card p-5 bg-white">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="is-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Publikasikan Ruangan (Status Aktif)
            </span>
            <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
              Jika dicentang, ruangan akan tampil di direktori kampus dan dapat diajukan peminjamannya oleh seluruh sivitas akademika.
            </span>
          </div>
        </label>
      </div>

      {uploadStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
          <span className="font-medium">{uploadStatus}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/admin/ruangan"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Batalkan dan Kembali
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{uploadStatus || "Menyimpan Data..."}</span>
            </>
          ) : (
            <span>{isEditing ? "Simpan Perubahan Ruangan" : "Simpan Ruangan Baru"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
