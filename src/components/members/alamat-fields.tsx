"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://www.emsifa.com/api-wilayah-indonesia/v2";

interface WilayahItem {
  id: string;
  name: string;
}

interface AlamatData {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  rt: string;
  rw: string;
}

interface AlamatFieldsProps {
  defaultValue?: Partial<AlamatData>;
}

/**
 * Fetch wilayah data dari API v2 emsifa.
 * Response v2: { data: [ { id, name, ... } ] }
 */
async function fetchWilayah(endpoint: string): Promise<WilayahItem[]> {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`);
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data ?? json;
    return items.map((item: { id: string; name: string }) => ({
      id: item.id,
      name: item.name,
    }));
  } catch {
    return [];
  }
}

// ── Searchable Combobox ──────────────────────────────────────
function SearchableSelect({
  label,
  placeholder,
  items,
  value,
  displayValue,
  onChange,
  disabled,
  loading,
}: {
  label: string;
  placeholder: string;
  items: WilayahItem[];
  value: string;
  displayValue?: string;
  onChange: (id: string, name: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [query, setQuery] = useState(displayValue || "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedName = items.find((i) => i.id === value)?.name ?? "";

  // Sync query when value or displayValue changes
  useEffect(() => {
    if (value && selectedName) {
      setQuery(selectedName);
    } else if (displayValue && !value) {
      setQuery(displayValue);
    } else if (!value && !displayValue) {
      setQuery("");
    }
  }, [value, selectedName, displayValue]);

  const filtered =
    query && query !== selectedName
      ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
      : items;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) {
          if (displayValue && !selectedName) setQuery(displayValue);
          else setQuery(selectedName || "");
        } else {
          setQuery(selectedName);
        }
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [value, selectedName, displayValue]);

  const handleSelect = useCallback(
    (item: WilayahItem) => {
      onChange(item.id, item.name);
      setQuery(item.name);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[12px] font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={loading ? "Memuat..." : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("", "");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        className={`w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all ${
          disabled || loading ? "opacity-50 cursor-not-allowed bg-gray-50" : ""
        }`}
      />
      {open && !disabled && !loading && items.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-gray-400">
              Tidak ditemukan
            </div>
          ) : (
            filtered.slice(0, 50).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-emerald-50 transition-colors cursor-pointer ${
                  item.id === value
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                {item.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export function AlamatFields({ defaultValue }: AlamatFieldsProps) {
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [regencies, setRegencies] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [villages, setVillages] = useState<WilayahItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [rt, setRt] = useState(defaultValue?.rt ?? "");
  const [rw, setRw] = useState(defaultValue?.rw ?? "");

  const [kabupatenName, setKabupatenName] = useState(defaultValue?.kabupaten ?? "");
  const [kecamatanName, setKecamatanName] = useState(defaultValue?.kecamatan ?? "");
  const [desaName, setDesaName] = useState(defaultValue?.desa ?? "");
  const [provinsiName, setProvinsiName] = useState(defaultValue?.provinsi ?? "");

  // Track if user has started selecting from API (vs showing default names)
  const [hasSelectedProvince, setHasSelectedProvince] = useState(false);

  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load provinces
  useEffect(() => {
    fetchWilayah("provinces.json").then(setProvinces);
  }, []);

  // Load regencies — only reset child fields when user actively picks a new province
  useEffect(() => {
    if (!selectedProvince) {
      setRegencies([]);
      if (hasSelectedProvince) {
        setSelectedRegency("");
        setDistricts([]);
        setSelectedDistrict("");
        setVillages([]);
        setSelectedVillage("");
        setKabupatenName("");
        setKecamatanName("");
        setDesaName("");
      }
      return;
    }
    setLoadingRegencies(true);
    fetchWilayah(`regencies/${selectedProvince}.json`)
      .then(setRegencies)
      .finally(() => setLoadingRegencies(false));
  }, [selectedProvince, hasSelectedProvince]);

  // Load districts
  useEffect(() => {
    if (!selectedRegency) {
      setDistricts([]);
      if (hasSelectedProvince) {
        setSelectedDistrict("");
        setVillages([]);
        setSelectedVillage("");
        setKecamatanName("");
        setDesaName("");
      }
      return;
    }
    setLoadingDistricts(true);
    fetchWilayah(`districts/${selectedRegency}.json`)
      .then(setDistricts)
      .finally(() => setLoadingDistricts(false));
  }, [selectedRegency, hasSelectedProvince]);

  // Load villages
  useEffect(() => {
    if (!selectedDistrict) {
      setVillages([]);
      if (hasSelectedProvince) {
        setSelectedVillage("");
        setDesaName("");
      }
      return;
    }
    setLoadingVillages(true);
    fetchWilayah(`villages/${selectedDistrict}.json`)
      .then(setVillages)
      .finally(() => setLoadingVillages(false));
  }, [selectedDistrict, hasSelectedProvince]);

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all";

  return (
    <div className="space-y-3">
      <h4 className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Alamat
      </h4>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="provinsi" value={provinsiName} />
      <input type="hidden" name="kabupaten" value={kabupatenName} />
      <input type="hidden" name="kecamatan" value={kecamatanName} />
      <input type="hidden" name="desa" value={desaName} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SearchableSelect
          label="Provinsi"
          placeholder="Ketik nama provinsi..."
          items={provinces}
          value={selectedProvince}
          displayValue={!hasSelectedProvince ? provinsiName : undefined}
          onChange={(id, name) => {
            setSelectedProvince(id);
            setProvinsiName(name);
            setHasSelectedProvince(true);
            setSelectedRegency("");
            setSelectedDistrict("");
            setSelectedVillage("");
          }}
        />

        <SearchableSelect
          label="Kota / Kabupaten"
          placeholder="Ketik nama kota/kabupaten..."
          items={regencies}
          value={selectedRegency}
          displayValue={!hasSelectedProvince ? kabupatenName : undefined}
          onChange={(id, name) => {
            setSelectedRegency(id);
            setKabupatenName(name);
            setSelectedDistrict("");
            setSelectedVillage("");
          }}
          disabled={!selectedProvince && !kabupatenName}
          loading={loadingRegencies}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchableSelect
          label="Kecamatan"
          placeholder="Ketik nama kecamatan..."
          items={districts}
          value={selectedDistrict}
          displayValue={!hasSelectedProvince ? kecamatanName : undefined}
          onChange={(id, name) => {
            setSelectedDistrict(id);
            setKecamatanName(name);
            setSelectedVillage("");
          }}
          disabled={!selectedRegency && !kecamatanName}
          loading={loadingDistricts}
        />

        <SearchableSelect
          label="Desa / Kelurahan"
          placeholder="Ketik nama desa/kelurahan..."
          items={villages}
          value={selectedVillage}
          displayValue={!hasSelectedProvince ? desaName : undefined}
          onChange={(id, name) => {
            setSelectedVillage(id);
            setDesaName(name);
          }}
          disabled={!selectedDistrict && !desaName}
          loading={loadingVillages}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">RT</label>
          <input
            name="rt"
            type="text"
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            placeholder="001"
            maxLength={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">RW</label>
          <input
            name="rw"
            type="text"
            value={rw}
            onChange={(e) => setRw(e.target.value)}
            placeholder="001"
            maxLength={3}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
