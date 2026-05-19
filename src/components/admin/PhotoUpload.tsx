"use client";

import {useRef, useState} from "react";
import Image from "next/image";
import {createClient} from "@/lib/supabase/client";

type Props = {
    bucket: string;
    currentUrl?: string;
    onUpload: (url: string) => void;
    label?: string;
};

export function PhotoUpload({bucket, currentUrl, onUpload, label = "Photo"}: Props) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setUploading(true);

        const supabase = createClient();
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const {error: uploadError} = await supabase.storage
            .from(bucket)
            .upload(path, file, {upsert: false});

        if (uploadError) {
            setError(uploadError.message);
            setUploading(false);
            return;
        }

        const {
            data: {publicUrl},
        } = supabase.storage.from(bucket).getPublicUrl(path);

        onUpload(publicUrl);
        setUploading(false);
    }

    return (
        <div className="flex flex-col gap-2">
            <label
                className="text-sm font-medium"
                style={{color: "var(--color-text-primary)"}}
            >
                {label}
            </label>

            <div className="flex items-center gap-4">
                {currentUrl && (
                    <div
                        className="rounded-[var(--radius-md)] overflow-hidden shrink-0"
                        style={{width: 64, height: 64, backgroundColor: "var(--color-surface-raised)"}}
                    >
                        <Image
                            src={currentUrl}
                            alt="Current photo"
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                <div>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium border transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
                        style={{
                            backgroundColor: "var(--color-surface)",
                            borderColor: "var(--color-border-strong)",
                            color: "var(--color-text-primary)",

                        }}
                    >
                        {uploading ? "Uploading…" : currentUrl ? "Change photo" : "Upload photo"}
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFile}
                        className="hidden"
                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                </div>
            </div>
        </div>
    );
}
