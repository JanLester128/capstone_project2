<?php

namespace App\Helpers;

class PhilippineAddressData
{
    /**
     * Get all Mindanao provinces with their municipalities/cities, barangays, and zip codes
     */
    public static function getAddressData(): array
    {
        return [
            'Misamis Oriental' => [
                'zip_code' => '9000',
                'municipalities' => [
                    'Opol' => [
                        'zip_code' => '9016',
                        'barangays' => [
                            'Aplaya' => '9016',
                            'Bagocboc' => '9016',
                            'Barra' => '9016',
                            'Bonbon' => '9016',
                            'Cabuling' => '9016',
                            'Camanga' => '9016',
                            'Igpit' => '9016',
                            'Luyong Bonbon' => '9016',
                            'Malanang' => '9016',
                            'Nangcaon' => '9016',
                            'Taboc' => '9016',
                            'Tingalan' => '9016',
                        ]
                    ],
                    'Cagayan de Oro' => [
                        'zip_code' => '9000',
                        'barangays' => [
                            'Agusan' => '9000',
                            'Balulang' => '9000',
                            'Barangay 1' => '9000',
                            'Barangay 2' => '9000',
                            'Barangay 3' => '9000',
                            'Barangay 4' => '9000',
                            'Barangay 5' => '9000',
                            'Barangay 6' => '9000',
                            'Barangay 7' => '9000',
                            'Barangay 8' => '9000',
                            'Barangay 9' => '9000',
                            'Barangay 10' => '9000',
                            'Barangay 11' => '9000',
                            'Barangay 12' => '9000',
                            'Barangay 13' => '9000',
                            'Barangay 14' => '9000',
                            'Barangay 15' => '9000',
                            'Barangay 16' => '9000',
                            'Barangay 17' => '9000',
                            'Barangay 18' => '9000',
                            'Barangay 19' => '9000',
                            'Barangay 20' => '9000',
                            'Barangay 21' => '9000',
                            'Barangay 22' => '9000',
                            'Barangay 23' => '9000',
                            'Barangay 24' => '9000',
                            'Barangay 25' => '9000',
                            'Barangay 26' => '9000',
                            'Barangay 27' => '9000',
                            'Barangay 28' => '9000',
                            'Barangay 29' => '9000',
                            'Barangay 30' => '9000',
                            'Barangay 31' => '9000',
                            'Barangay 32' => '9000',
                            'Barangay 33' => '9000',
                            'Barangay 34' => '9000',
                            'Barangay 35' => '9000',
                            'Barangay 36' => '9000',
                            'Barangay 37' => '9000',
                            'Barangay 38' => '9000',
                            'Barangay 39' => '9000',
                            'Barangay 40' => '9000',
                            'Bonbon' => '9000',
                            'Bulua' => '9000',
                            'Camaman-an' => '9000',
                            'Canitoan' => '9000',
                            'Carmen' => '9000',
                            'Consolacion' => '9000',
                            'Cugman' => '9000',
                            'Gusa' => '9000',
                            'Iponan' => '9000',
                            'Kauswagan' => '9000',
                            'Lapasan' => '9000',
                            'Macabalan' => '9000',
                            'Macasandig' => '9000',
                            'Nazareth' => '9000',
                            'Patag' => '9000',
                            'Puntod' => '9000',
                            'Tablon' => '9000',
                            'Taglimao' => '9000',
                            'Tignapoloan' => '9000',
                            'Tuburan' => '9000',
                        ]
                    ],
                    'El Salvador' => [
                        'zip_code' => '9017',
                        'barangays' => [
                            'Bolobolo' => '9017',
                            'Calongonan' => '9017',
                            'Cogon' => '9017',
                            'Molugan' => '9017',
                            'Sinaloc' => '9017',
                            'Hinagdanan' => '9017',
                            'Kalabaylabay' => '9017',
                            'Sugbongcogon' => '9017',
                        ]
                    ],
                    'Alubijid' => [
                        'zip_code' => '9018',
                        'barangays' => [
                            'Baybay' => '9018',
                            'Calatcat' => '9018',
                            'Labo' => '9018',
                            'Lourdes' => '9018',
                            'Lumbayao' => '9018',
                            'Poblacion' => '9018',
                            'Sampatulog' => '9018',
                            'Tugasnon' => '9018',
                        ]
                    ],
                    'Balingasag' => [
                        'zip_code' => '9005',
                        'barangays' => [
                            'Baliwagan' => '9005',
                            'Barangay 1' => '9005',
                            'Barangay 2' => '9005',
                            'Barangay 3' => '9005',
                            'Barangay 4' => '9005',
                            'Barangay 5' => '9005',
                            'Barangay 6' => '9005',
                            'Barangay 7' => '9005',
                            'Barangay 8' => '9005',
                            'Barangay 9' => '9005',
                            'Barangay 10' => '9005',
                            'Barangay 11' => '9005',
                            'Barangay 12' => '9005',
                            'Barangay 13' => '9005',
                            'Barangay 14' => '9005',
                            'Barangay 15' => '9005',
                            'Barangay 16' => '9005',
                            'Barangay 17' => '9005',
                            'Barangay 18' => '9005',
                            'Barangay 19' => '9005',
                            'Barangay 20' => '9005',
                            'Barangay 21' => '9005',
                            'Barangay 22' => '9005',
                            'Barangay 23' => '9005',
                            'Barangay 24' => '9005',
                            'Barangay 25' => '9005',
                            'Barangay 26' => '9005',
                            'Barangay 27' => '9005',
                            'Barangay 28' => '9005',
                            'Barangay 29' => '9005',
                            'Barangay 30' => '9005',
                        ]
                    ],
                ]
            ],
            'Bukidnon' => [
                'zip_code' => '8700',
                'municipalities' => [
                    'Malaybalay' => [
                        'zip_code' => '8700',
                        'barangays' => [
                            'Aglayan' => '8700',
                            'Bangcud' => '8700',
                            'Barangay 1' => '8700',
                            'Barangay 2' => '8700',
                            'Barangay 3' => '8700',
                            'Barangay 4' => '8700',
                            'Barangay 5' => '8700',
                            'Barangay 6' => '8700',
                            'Barangay 7' => '8700',
                            'Barangay 8' => '8700',
                            'Barangay 9' => '8700',
                            'Barangay 10' => '8700',
                            'Barangay 11' => '8700',
                            'Casisang' => '8700',
                            'Dalwangan' => '8700',
                            'Impasugong' => '8700',
                            'Kalasungay' => '8700',
                            'Kibalabag' => '8700',
                            'Kulaman' => '8700',
                            'Laguitas' => '8700',
                            'Linabo' => '8700',
                            'Magsaysay' => '8700',
                            'Patpat' => '8700',
                            'Sumpong' => '8700',
                            'Violeta' => '8700',
                        ]
                    ],
                    'Valencia' => [
                        'zip_code' => '8709',
                        'barangays' => [
                            'Bagontaas' => '8709',
                            'Banlag' => '8709',
                            'Barobo' => '8709',
                            'Batangan' => '8709',
                            'Catumbalon' => '8709',
                            'Colonia' => '8709',
                            'Concepcion' => '8709',
                            'Kahapunan' => '8709',
                            'Lilingayon' => '8709',
                            'Lourdes' => '8709',
                            'Lumbayao' => '8709',
                            'Lurugan' => '8709',
                            'Maapag' => '8709',
                            'Manolo Fortich' => '8709',
                            'Poblacion' => '8709',
                            'San Carlos' => '8709',
                            'San Isidro' => '8709',
                            'Santo Niño' => '8709',
                            'Sugod' => '8709',
                            'Tongantongan' => '8709',
                        ]
                    ],
                ]
            ],
            'Lanao del Norte' => [
                'zip_code' => '9200',
                'municipalities' => [
                    'Iligan' => [
                        'zip_code' => '9200',
                        'barangays' => [
                            'Acmac' => '9200',
                            'Bagong Silang' => '9200',
                            'Bonbonon' => '9200',
                            'Bunawan' => '9200',
                            'Buru-un' => '9200',
                            'Dalipuga' => '9200',
                            'Del Carmen' => '9200',
                            'Digkilaan' => '9200',
                            'Ditucalan' => '9200',
                            'Dulay' => '9200',
                            'Hinaplanon' => '9200',
                            'Hindang' => '9200',
                            'Kabacsanan' => '9200',
                            'Kalilangan' => '9200',
                            'Kiwanan' => '9200',
                            'Lanipao' => '9200',
                            'Luinab' => '9200',
                            'Mahayahay' => '9200',
                            'Mainit' => '9200',
                            'Mandulog' => '9200',
                            'Maria Cristina' => '9200',
                            'Palao' => '9200',
                            'Panoroganan' => '9200',
                            'Poblacion' => '9200',
                            'Puga-an' => '9200',
                            'Rogongon' => '9200',
                            'San Miguel' => '9200',
                            'Santa Elena' => '9200',
                            'Santa Filomena' => '9200',
                            'Santiago' => '9200',
                            'Santo Rosario' => '9200',
                            'Saray' => '9200',
                            'Suarez' => '9200',
                            'Tambacan' => '9200',
                            'Tibanga' => '9200',
                            'Tipanoy' => '9200',
                            'Tubod' => '9200',
                            'Ubaldo Laya' => '9200',
                            'Villa Verde' => '9200',
                        ]
                    ],
                ]
            ],
            'Davao del Norte' => [
                'zip_code' => '8100',
                'municipalities' => [
                    'Tagum' => [
                        'zip_code' => '8100',
                        'barangays' => [
                            'Apokon' => '8100',
                            'Bincungan' => '8100',
                            'Busaon' => '8100',
                            'Canocotan' => '8100',
                            'Cuambogan' => '8100',
                            'La Filipina' => '8100',
                            'Liboganon' => '8100',
                            'Madaum' => '8100',
                            'Magdum' => '8100',
                            'Mankilam' => '8100',
                            'New Balamban' => '8100',
                            'Pagsabangan' => '8100',
                            'Pandapan' => '8100',
                            'San Isidro' => '8100',
                            'San Miguel' => '8100',
                            'Visayan Village' => '8100',
                        ]
                    ],
                ]
            ],
            'Davao del Sur' => [
                'zip_code' => '8000',
                'municipalities' => [
                    'Davao' => [
                        'zip_code' => '8000',
                        'barangays' => [
                            'Agdao' => '8000',
                            'Buhangin' => '8000',
                            'Bunawan' => '8000',
                            'Calinan' => '8000',
                            'Marilog' => '8000',
                            'Paquibato' => '8000',
                            'Poblacion' => '8000',
                            'Talomo' => '8000',
                            'Tugbok' => '8000',
                        ]
                    ],
                ]
            ],
            'Cotabato' => [
                'zip_code' => '9400',
                'municipalities' => [
                    'Kidapawan' => [
                        'zip_code' => '9400',
                        'barangays' => [
                            'Amas' => '9400',
                            'Balabag' => '9400',
                            'Balindog' => '9400',
                            'Binoligan' => '9400',
                            'Ginatilan' => '9400',
                            'Ilomavis' => '9400',
                            'Indangan' => '9400',
                            'Junction' => '9400',
                            'Kalaisan' => '9400',
                            'Kalasuyan' => '9400',
                            'Kalawag' => '9400',
                            'Lanao' => '9400',
                            'Linao' => '9400',
                            'Luvimin' => '9400',
                            'Magsaysay' => '9400',
                            'Malinan' => '9400',
                            'Manongol' => '9400',
                            'Marbel' => '9400',
                            'Matalam' => '9400',
                            'Meohao' => '9400',
                            'New Bohol' => '9400',
                            'Patadon' => '9400',
                            'Perez' => '9400',
                            'Poblacion' => '9400',
                            'Saguing' => '9400',
                            'San Isidro' => '9400',
                            'Santo Niño' => '9400',
                            'Sua-on' => '9400',
                            'Sudapin' => '9400',
                            'Sumbac' => '9400',
                            'Tuburan' => '9400',
                        ]
                    ],
                ]
            ],
            'Zamboanga del Norte' => [
                'zip_code' => '7100',
                'municipalities' => [
                    'Dipolog' => [
                        'zip_code' => '7100',
                        'barangays' => [
                            'Barra' => '7100',
                            'Biasong' => '7100',
                            'Central' => '7100',
                            'Cogon' => '7100',
                            'Dicayas' => '7100',
                            'Estaka' => '7100',
                            'Galas' => '7100',
                            'Gulayon' => '7100',
                            'Lugdungan' => '7100',
                            'Miputak' => '7100',
                            'Olingan' => '7100',
                            'Ponot' => '7100',
                            'San Jose' => '7100',
                            'Sangkol' => '7100',
                            'Santa Isabel' => '7100',
                            'Sicayab' => '7100',
                            'Sinaman' => '7100',
                            'Turno' => '7100',
                        ]
                    ],
                ]
            ],
            'Zamboanga del Sur' => [
                'zip_code' => '7000',
                'municipalities' => [
                    'Zamboanga' => [
                        'zip_code' => '7000',
                        'barangays' => [
                            'Arena Blanco' => '7000',
                            'Ayala' => '7000',
                            'Baluno' => '7000',
                            'Boalan' => '7000',
                            'Bolong' => '7000',
                            'Buenavista' => '7000',
                            'Bunguiao' => '7000',
                            'Busay' => '7000',
                            'Cabaluay' => '7000',
                            'Cabatangan' => '7000',
                            'Calarian' => '7000',
                            'Cawit' => '7000',
                            'Culianan' => '7000',
                            'Curuan' => '7000',
                            'Dita' => '7000',
                            'Divisoria' => '7000',
                            'Dulian' => '7000',
                            'Guisao' => '7000',
                            'Lamisahan' => '7000',
                            'Landang Gua' => '7000',
                            'Landang Laum' => '7000',
                            'Lanzones' => '7000',
                            'Lapakan' => '7000',
                            'Latuan' => '7000',
                            'Limpapa' => '7000',
                            'Lubigan' => '7000',
                            'Lumayang' => '7000',
                            'Lumbangan' => '7000',
                            'Lunzuran' => '7000',
                            'Maasin' => '7000',
                            'Malagutay' => '7000',
                            'Mampang' => '7000',
                            'Manalipa' => '7000',
                            'Mangusu' => '7000',
                            'Manicahan' => '7000',
                            'Mariki' => '7000',
                            'Mercedes' => '7000',
                            'Muti' => '7000',
                            'Pasonanca' => '7000',
                            'Patalon' => '7000',
                            'Putik' => '7000',
                            'Quiniput' => '7000',
                            'Recodo' => '7000',
                            'Rio Hondo' => '7000',
                            'Salaan' => '7000',
                            'San Jose Cawa-Cawa' => '7000',
                            'San Jose Gusu' => '7000',
                            'San Roque' => '7000',
                            'Sangali' => '7000',
                            'Santa Barbara' => '7000',
                            'Santa Catalina' => '7000',
                            'Santa Maria' => '7000',
                            'Santo Niño' => '7000',
                            'Sibulao' => '7000',
                            'Sinubong' => '7000',
                            'Sinunuc' => '7000',
                            'Tagasilay' => '7000',
                            'Taguiti' => '7000',
                            'Talabaan' => '7000',
                            'Talisayan' => '7000',
                            'Taluksangay' => '7000',
                            'Tigbalabag' => '7000',
                            'Tigtabon' => '7000',
                            'Tolosa' => '7000',
                            'Tugbungan' => '7000',
                            'Tumaga' => '7000',
                            'Tumalutab' => '7000',
                            'Tumitus' => '7000',
                            'Vitali' => '7000',
                            'Zambowood' => '7000',
                        ]
                    ],
                ]
            ],
            // Add more provinces as needed
            'Agusan del Norte' => [
                'zip_code' => '8600',
                'municipalities' => [
                    'Butuan' => [
                        'zip_code' => '8600',
                        'barangays' => [
                            'Agao' => '8600',
                            'Ampayon' => '8600',
                            'Baan' => '8600',
                            'Bading' => '8600',
                            'Bancasi' => '8600',
                            'Banza' => '8600',
                            'Baobaoan' => '8600',
                            'Basag' => '8600',
                            'Bayanihan' => '8600',
                            'Bilay' => '8600',
                            'Bit-os' => '8600',
                            'Bitan-agan' => '8600',
                            'Bobon' => '8600',
                            'Bonbon' => '8600',
                            'Bugabos' => '8600',
                            'Buhangin' => '8600',
                            'Cabcabon' => '8600',
                            'Camayahan' => '8600',
                            'Dagohoy' => '8600',
                            'Dankias' => '8600',
                            'De Oro' => '8600',
                            'Dumalagan' => '8600',
                            'Golden Ribbon' => '8600',
                            'Humabon' => '8600',
                            'Jose Rizal' => '8600',
                            'Lapaz' => '8600',
                            'Lemon' => '8600',
                            'Lumbocan' => '8600',
                            'Maon' => '8600',
                            'Masao' => '8600',
                            'Maug' => '8600',
                            'Nong-nong' => '8600',
                            'Obrero' => '8600',
                            'Ong Yiu' => '8600',
                            'Pianing' => '8600',
                            'Pinamanculan' => '8600',
                            'Port Poyohon' => '8600',
                            'Rajah Soliman' => '8600',
                            'San Ignacio' => '8600',
                            'San Mateo' => '8600',
                            'San Vicente' => '8600',
                            'Santo Niño' => '8600',
                            'Sumilihon' => '8600',
                            'Tagabaca' => '8600',
                            'Taguibo' => '8600',
                            'Taligaman' => '8600',
                            'Tandang Sora' => '8600',
                            'Tiniwisan' => '8600',
                            'Tungao' => '8600',
                            'Urios' => '8600',
                            'Villa Kananga' => '8600',
                        ]
                    ],
                ]
            ],
        ];
    }

    /**
     * Get municipalities/cities for a specific province
     */
    public static function getMunicipalities(string $province): array
    {
        $data = self::getAddressData();
        if (!isset($data[$province])) {
            return [];
        }
        return array_keys($data[$province]['municipalities']);
    }

    /**
     * Get barangays for a specific municipality/city in a province
     */
    public static function getBarangays(string $province, string $municipality): array
    {
        $data = self::getAddressData();
        if (!isset($data[$province]['municipalities'][$municipality])) {
            return [];
        }
        return array_keys($data[$province]['municipalities'][$municipality]['barangays']);
    }

    /**
     * Get zip code for a specific province, municipality, and barangay
     */
    public static function getZipCode(string $province, ?string $municipality = null, ?string $barangay = null): ?string
    {
        $data = self::getAddressData();
        
        if (!isset($data[$province])) {
            return null;
        }

        // If municipality is provided, get municipality zip code
        if ($municipality && isset($data[$province]['municipalities'][$municipality])) {
            // If barangay is provided, get barangay-specific zip code
            if ($barangay && isset($data[$province]['municipalities'][$municipality]['barangays'][$barangay])) {
                return $data[$province]['municipalities'][$municipality]['barangays'][$barangay];
            }
            // Otherwise return municipality zip code
            return $data[$province]['municipalities'][$municipality]['zip_code'];
        }

        // Return province default zip code
        return $data[$province]['zip_code'];
    }

    /**
     * Get all provinces
     */
    public static function getProvinces(): array
    {
        return array_keys(self::getAddressData());
    }
}

