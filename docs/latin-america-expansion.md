# Latin America and global gap expansion

**Status:** implemented in November 2026.

**Scope:** 225 new buildings. 155 cover Latin America and the Caribbean. 70 fill
global gaps in countries, eras, styles and building types. The catalog grew from
598 to **823** buildings.

## Why this batch

The 598-building catalog was strong on Europe, Asia and the United States, but
Latin America had only 74 entries. Several countries had no entry at all:
Venezuela, Nicaragua, El Salvador, Costa Rica and Belize. Most of the Caribbean
was missing. Mexico had 12 entries, Brazil 14 and Peru 7, far below their depth of
architectural history.

Outside Latin America, the catalog had no entry for 32 countries, including
Belarus, Bahrain, Brunei, Burkina Faso, Cameroon, Eritrea, Gambia, Kyrgyzstan,
Maldives, Mauritania, Niger, Namibia, North Korea, Oman, Papua New Guinea, the
Republic of the Congo, Togo, Turkmenistan, Tajikistan, Moldova, Kosovo, North
Macedonia, Albania, Cyprus, Luxembourg, Liechtenstein, San Marino, Andorra,
Mozambique, Angola, Sierra Leone and Lesotho. It was also thin on Neolithic,
Byzantine, Romanesque, Rococo, Art Nouveau, Brutalist, Metabolism and Postmodern
work, and on educational, transport, funerary, spectacle and infrastructure types.

## Coverage

### Latin America and the Caribbean

| Country | Before | Added | After |
| --- | ---: | ---: | ---: |
| Mexico | 12 | 24 | 36 |
| Brazil | 14 | 14 | 28 |
| Peru | 7 | 12 | 19 |
| Colombia | 5 | 10 | 15 |
| Argentina | 5 | 8 | 13 |
| Chile | 5 | 6 | 11 |
| Bolivia | 4 | 5 | 9 |
| Ecuador | 4 | 5 | 9 |
| Venezuela | 0 | 9 | 9 |
| Cuba | 2 | 5 | 7 |
| Guatemala | 2 | 5 | 7 |
| Uruguay | 3 | 4 | 7 |
| Nicaragua | 0 | 5 | 5 |
| Panama | 2 | 3 | 5 |
| Paraguay | 2 | 3 | 5 |
| Costa Rica | 0 | 4 | 4 |
| Dominican Republic | 1 | 3 | 4 |
| Puerto Rico | 1 | 3 | 4 |
| Belize | 0 | 3 | 3 |
| El Salvador | 0 | 3 | 3 |
| Honduras | 1 | 2 | 3 |
| Barbados | 0 | 2 | 2 |
| Curaçao | 1 | 1 | 2 |
| Haiti | 1 | 1 | 2 |
| Jamaica | 0 | 2 | 2 |
| Suriname | 1 | 1 | 2 |
| Trinidad and Tobago | 0 | 2 | 2 |
| Antigua and Barbuda | 0 | 1 | 1 |
| Aruba | 0 | 1 | 1 |
| Bahamas | 0 | 1 | 1 |
| Dominica | 0 | 1 | 1 |
| French Guiana | 0 | 1 | 1 |
| Grenada | 0 | 1 | 1 |
| Guadeloupe | 0 | 1 | 1 |
| Guyana | 1 | 0 | 1 |
| Martinique | 0 | 1 | 1 |
| Saint Kitts and Nevis | 0 | 1 | 1 |
| United States Virgin Islands | 0 | 1 | 1 |
| **Total** | **74** | **155** | **229** |

The batch adds the first entries for 17 Latin American and Caribbean countries and
territories: Venezuela, Nicaragua, El Salvador, Costa Rica, Belize, Jamaica,
Bahamas, Barbados, Trinidad and Tobago, Aruba, Martinique, Guadeloupe, Saint Kitts
and Nevis, Antigua and Barbuda, Dominica, Grenada and the United States Virgin
Islands. It also moves Mexico, Brazil, Peru, Colombia and Argentina from thin
coverage to a representative set.

### Global gaps

The global batch adds the first entry for 32 countries:

- Europe: Belarus, Moldova, Kosovo, North Macedonia, Albania, Cyprus, Luxembourg,
  Liechtenstein, San Marino, Andorra.
- Asia: Bahrain, Brunei, Kyrgyzstan, Maldives, Oman, North Korea, Turkmenistan,
  Tajikistan.
- Africa: Burkina Faso, Cameroon, Eritrea, Gambia, Mauritania, Niger, Namibia,
  Republic of the Congo, Togo, Mozambique, Angola, Sierra Leone, Lesotho.
- Oceania: Papua New Guinea.

It also adds:

- **Neolithic and prehistoric architecture:** Skara Brae, Ħaġar Qim, Çatalhöyük,
  Tell es-Sultan, Biskupin, Sarazm.
- **Byzantine and medieval:** Mystras, Basilica of San Vitale, Gračanica
  Monastery, Church of Saint Sophia in Ohrid, Bellapais Abbey, Vianden Castle,
  Vaduz Castle, Guaita, Sant Joan de Caselles.
- **Renaissance to Rococo:** Villa La Rotonda, Palace of Fontainebleau, Würzburg
  Residence, Sanssouci.
- **Modern movements:** Secession Building, Hôtel Tassel, Trellick Tower, Barbican
  Estate, Unité d'habitation, Torre Velasca, Geisel Library, Yoyogi National
  Stadium, 550 Madison Avenue, Portland Building, Vitra Fire Station, MAXXI.
- **Building types:** educational (Bodleian Library, King's College Chapel,
  Biblioteca Joanina), transport (Madrid Atocha, Gare du Nord), funerary (Castel
  Sant'Angelo), spectacle (Circus Maximus, Globe Theatre), commercial (Galleria
  Vittorio Emanuele II) and infrastructure (Dujiangyan).

## Method

1. Compared the existing catalog against UNESCO World Heritage cultural sites,
   national heritage lists and standard architecture-school canons for Latin
   America and the Caribbean.
2. Selected candidates that are recognisable, visually distinctive and
   representative of a country, era, style or type that the catalog lacked.
3. Checked every English Wikipedia title against the live encyclopedia. All 225
   titles were validated. Titles that redirected to a different article were
   corrected before import.
4. Cross-checked country, inception date, architect and style with Wikipedia,
   Wikidata and official or heritage sources where available.
5. Wrote the English blurbs and facts in our own words, then wrote the Spanish copy
   by hand. No text is copied from Wikipedia.
6. Ran the full test suite: unique IDs and names, valid clue values, known
   materials, Spanish copy for every building and controlled value.

## New controlled vocabulary

### Materials

`Tezontle`, `Cantera`, `Sillar`, `Volcanic rock`, `Halite`, `Earth`, `Grass` and
`Bamboo` were added to the material table and mapped to an existing material
family. This keeps the comparison rules stable while allowing accurate Latin
American and vernacular descriptions.

### Styles

`Aztec`, `Olmec`, `Toltec`, `Xochicalco`, `Casas Grandes`, `Chavín`, `Moche`,
`Chachapoya`, `Tairona`, `Diquís`, `Atacameño`, `Dilmun`, `Karakhanid`,
`Neocolonial`, `Rococo`, `Jacobean`, `Megalithic`, `Metabolism` and
`Ancient Chinese` were added with Spanish translations.

### Types

`Capitol`, `Ceremonial centre`, `University campus`, `Fire station`, `Great
house`, `Plantation house`, `Mansion`, `Dockyard`, `Synagogue`, `Stone spheres`,
`Mint`, `Waterworks`, `Estancia`, `Penal colony`, `Market`, `Tower houses`,
`Mountain fortress`, `Chariot racing track`, `Irrigation system`, `Arena`,
`Village`, `Cultural complex`, `Residential complex`, `Fortified settlement` and
`Mining town` were added with Spanish translations.

## Remaining country gaps

The catalog still has no entry for 34 countries. Most are small island states or
countries where a single internationally recognisable building is hard to justify.
The strongest candidates for a future pass are:

- **Kazakhstan:** Hazrat Sultan Mosque or the Bayterek tower.
- **Slovakia:** Bratislava Castle or St. Martin's Cathedral.
- **Uganda:** the Kasubi Tombs.
- **DR Congo:** the Limete Tower or a major colonial-era church.
- **Zambia:** the Victoria Falls Bridge, which is shared with Zimbabwe.
- **Botswana:** Tsodilo, although it is rock art rather than architecture.
- **Fiji, Samoa and Vanuatu:** traditional meeting houses and colonial
  administrative buildings need a careful recognisability review.

The remaining list is: Botswana, Burundi, Central African Republic, Chad, Comoros,
Djibouti, DR Congo, Equatorial Guinea, Eswatini, Fiji, Gabon, Guinea, Guinea-Bissau,
Kazakhstan, Kiribati, Liberia, Malawi, Marshall Islands, Nauru, Palau, Saint Lucia,
Saint Vincent and the Grenadines, Samoa, São Tomé and Príncipe, Seychelles,
Slovakia, Solomon Islands, Somalia, South Sudan, Timor-Leste, Tuvalu, Uganda,
Vanuatu and Zambia.

## Date policy

The `year` field is the completion, consecration or opening date. For
archaeological sites it is the main construction phase, the peak of the site or
the event that fixed it in history. A `yearNote` gives the range when a single
year would be misleading. Dates for pre-Columbian and medieval sites are
approximate and should be read with the note.

## Files

English data:

- `server/src/data/latam-mexico.ts` (24)
- `server/src/data/latam-central-america.ts` (25)
- `server/src/data/latam-caribbean.ts` (28)
- `server/src/data/latam-south-america.ts` (78)
- `server/src/data/global-gaps.ts` (70)

Spanish copy:

- `src/i18n/esLatamMexico.ts`
- `src/i18n/esLatamCentral.ts`
- `src/i18n/esLatamCaribbean.ts`
- `src/i18n/esLatamSouth.ts`
- `src/i18n/esLatam.ts` (merged copy and controlled vocabulary)
- `src/i18n/esGlobal.ts`

The machine-readable list is in `docs/latin-america-expansion.csv`.

## Caveats

- Some Latin American colonial buildings have uncertain architects. Those entries
  use `Unknown` rather than a guess.
- A few sites are protected archaeological zones rather than single buildings. They
  are included because they are architectural complexes or settlements, and the
  type and form fields say so.
- The catalog remains a curated game list, not a heritage inventory. Local or
  vernacular buildings with low international recognition were left out.
