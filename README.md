# 🕴️!NYXÖ Brussels 🧙‍♂️

**« Un Outil pour les gouverner toustes »**

Graphe de connaissances pour la santé mentale et l'empowerment citoyen à Bruxelles.

## 📊 Statistiques

- **453 entités** : institutions, services, SSM, associations, concepts
- **194 relations** : liens entre entités
- **25 zones** : communes bruxelloises et régions
- **25 flashcards** : pour apprendre le système

## 🎮 Deux modes

### Mode Gandalf 🧙
- Ton chaud, références Tolkien
- Interface "parchemin"
- Citations inspirantes
- Pour naviguer et explorer

### Mode Agent Smith 🕴️
- Ton froid, références Matrix
- Interface "terminal"
- Efficacité maximale
- Pour travailler sérieusement

**Raccourcis clavier :**
- `Ctrl+G` : Mode Gandalf
- `Ctrl+Shift+S` : Mode Agent Smith
- `Échap` : Fermer les modales
- Konami code : Easter egg 🎮

## 🚀 Déploiement

### Option 1 : GitHub Pages (gratuit)

1. Créer un repo GitHub `nyxo-brussels`
2. Uploader les fichiers du dossier `nyxo-brussels/`
3. Aller dans Settings > Pages
4. Sélectionner la branche `main` comme source
5. Ton site sera accessible sur `https://ton-username.github.io/nyxo-brussels/`

### Option 2 : Serveur local

```bash
cd nyxo-brussels
python -m http.server 8000
# ou
npx serve .
```

Puis ouvrir `http://localhost:8000`

### Option 3 : Netlify/Vercel (gratuit)

Glisser-déposer le dossier sur netlify.com ou vercel.com

## 📁 Structure des fichiers

```
nyxo-brussels/
├── index.html          # Interface principale (tout-en-un)
├── nyxo-unified.json   # Données JSON-LD unifiées
├── unify-data.js       # Script de fusion des données
└── README.md           # Ce fichier
```

## 🔗 Web Sémantique

Le fichier `nyxo-unified.json` est un graphe JSON-LD valide utilisant :

- **schema.org** : vocabulaire principal
- **nyxo:** : ontologie personnalisée pour les propriétés spécifiques
- **skos:** : pour les concepts et taxonomies

### Exemple d'entité

```json
{
  "@id": "https://nyxo.brussels/entity/org_iriscare",
  "@type": "GovernmentOrganization",
  "name": "Iriscare",
  "description": "Organisme (COCOM) qui finance/encadre notamment revalidation psychosociale, IHP, MSP.",
  "nyxo:entityType": "institution",
  "nyxo:layer": "TAROT",
  "nyxo:confidence": 0.85,
  "nyxo:tags": ["institution", "financement"]
}
```

## 🔄 Mise à jour des données

Pour régénérer le fichier unifié après modification des sources :

```bash
node unify-data.js
```

**Sources utilisées :**
- `deep-pump.json` : Graphe santé mentale Bruxelles
- `organisations.json` : Organisations socio-politiques
- `decret_1.csv` : Associations éducation permanente (Décret 2003)
- `flashcards.csv` : Questions d'apprentissage

## 📜 Licence

CC BY-SA 4.0 — Libre de réutiliser, modifier, partager sous les mêmes conditions.

## 🤝 Contribuer

Le projet recrute. Si tu veux rejoindre la Communauté de l'Anneau (ou la Matrice), contacte-nous.

---

*« Tout ce que nous avons à décider, c'est ce que nous devons faire du temps qui nous est imparti. »* — Gandalf

*« The Matrix has you... but so does the social safety net. »* — NYXO
