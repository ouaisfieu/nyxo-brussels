/**
 * NYXO Data Unifier
 * "One Ring to rule them all, One Ring to find them"
 * 
 * Fusionne toutes les sources de données en un graphe JSON-LD unifié
 */

const fs = require('fs');
const path = require('path');

// Charger les données
const deepPump = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/deep-pump.json'), 'utf8'));
const organisations = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/organisations.json'), 'utf8'));

// Parser CSV simple
function parseCSV(content) {
  const lines = content.replace(/\r/g, '').split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const decret1 = parseCSV(fs.readFileSync(path.join(__dirname, '../data/decret_1.csv'), 'utf8'));
const flashcards = parseCSV(fs.readFileSync(path.join(__dirname, '../data/flashcards.csv'), 'utf8'));

// Générer un ID slug
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Construire le graphe unifié
const unifiedGraph = {
  "@context": {
    "@vocab": "https://schema.org/",
    "nyxo": "https://nyxo.brussels/ontology/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "confidence": "nyxo:confidence",
    "layer": "nyxo:layer",
    "zone": "nyxo:zone",
    "relationType": "nyxo:relationType"
  },
  "@id": "https://nyxo.brussels/graph",
  "@type": "Dataset",
  "name": "NYXO Brussels Knowledge Graph",
  "description": "Graphe de connaissances unifié pour la santé mentale et l'empowerment citoyen à Bruxelles",
  "version": "2.0.0",
  "dateModified": new Date().toISOString().split('T')[0],
  "license": "https://creativecommons.org/licenses/by-sa/4.0/",
  "creator": {
    "@type": "Organization",
    "@id": "https://nyxo.brussels/#organisation",
    "name": "NYXO Brussels"
  },
  "statistics": {
    "entities": 0,
    "relations": 0,
    "zones": 0,
    "flashcards": 0
  },
  "zones": [],
  "entities": [],
  "relations": [],
  "flashcards": []
};

// 1. Ajouter les zones du Deep Pump
deepPump.zones.forEach(zone => {
  unifiedGraph.zones.push({
    "@id": `https://nyxo.brussels/zone/${zone.id}`,
    "@type": "Place",
    "name": zone.label,
    "identifier": zone.id,
    "nyxo:coordinates": { x: zone.x, y: zone.y },
    "nyxo:layer": zone.layer,
    "nyxo:opacity": zone.opacity
  });
});

// 2. Ajouter les entités du Deep Pump
deepPump.entities.forEach(entity => {
  const unified = {
    "@id": `https://nyxo.brussels/entity/${entity.id}`,
    "@type": mapEntityType(entity.type),
    "name": entity.display.masked_name,
    "description": entity.display.summary,
    "identifier": entity.id,
    "nyxo:entityType": entity.type,
    "nyxo:subtype": entity.subtype,
    "nyxo:layer": entity.layer,
    "nyxo:confidence": entity.confidence,
    "nyxo:tags": entity.tags,
    "nyxo:zone": entity.zone ? `https://nyxo.brussels/zone/${entity.zone}` : null
  };
  
  if (entity.display.real_name) {
    unified.alternateName = entity.display.real_name;
  }
  
  if (entity.fields && entity.fields._evidence) {
    unified["nyxo:sources"] = entity.fields._evidence;
  }
  
  unifiedGraph.entities.push(unified);
});

// 3. Ajouter les organisations socio-politiques
organisations.forEach(org => {
  const id = slugify(org.name);
  
  // Vérifier si l'entité existe déjà
  const exists = unifiedGraph.entities.find(e => 
    e.name.toLowerCase() === org.name.toLowerCase()
  );
  
  if (!exists) {
    unifiedGraph.entities.push({
      "@id": `https://nyxo.brussels/entity/org_${id}`,
      "@type": "Organization",
      "name": org.name,
      "description": org.description,
      "url": org.url,
      "email": org.email || null,
      "nyxo:entityType": "organization",
      "nyxo:category": org.category,
      "nyxo:layer": "SOCIOPOLITIQUE",
      "nyxo:confidence": 0.9,
      "areaServed": org.areaServed,
      "nyxo:stats": org.additionalProperty ? 
        org.additionalProperty.find(p => p.name === 'stat')?.value : null
    });
  }
});

// 4. Ajouter les associations du Décret 2003
decret1.forEach(assoc => {
  if (!assoc.NOM_ASSOCIATION) return;
  
  const id = slugify(assoc.NOM_ASSOCIATION);
  
  // Vérifier si l'entité existe déjà
  const exists = unifiedGraph.entities.find(e => 
    e.name && e.name.toLowerCase() === assoc.NOM_ASSOCIATION.toLowerCase()
  );
  
  if (!exists) {
    unifiedGraph.entities.push({
      "@id": `https://nyxo.brussels/entity/assoc_${id}`,
      "@type": "Organization",
      "name": assoc.NOM_ASSOCIATION,
      "alternateName": assoc.Sigle || null,
      "nyxo:entityType": "association",
      "nyxo:layer": "EDUCATION_PERMANENTE",
      "nyxo:category": "Éducation permanente",
      "nyxo:axes": assoc.AXES,
      "nyxo:reconnaissance": assoc.RECONNAISSANCE,
      "nyxo:confidence": 0.95,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": assoc.ADRESSE,
        "postalCode": assoc['C.P.'],
        "addressLocality": assoc.LOCALITE,
        "addressCountry": "BE"
      },
      "telephone": assoc['TEL.'] || null,
      "faxNumber": assoc.FAX || null,
      "email": assoc['E.MAIL'] || null,
      "url": assoc['Site Web'] ? 
        (assoc['Site Web'].startsWith('http') ? assoc['Site Web'] : `https://${assoc['Site Web']}`) : null
    });
  }
});

// 5. Ajouter les relations du Deep Pump
deepPump.relations.forEach(rel => {
  unifiedGraph.relations.push({
    "@id": `https://nyxo.brussels/relation/${rel.id}`,
    "@type": "nyxo:Relation",
    "nyxo:relationType": rel.type,
    "nyxo:from": `https://nyxo.brussels/entity/${rel.from}`,
    "nyxo:to": `https://nyxo.brussels/entity/${rel.to}`,
    "nyxo:confidence": rel.confidence,
    "nyxo:weight": rel.weight,
    "nyxo:evidence": rel.evidence,
    "nyxo:notes": rel.notes
  });
});

// 6. Ajouter les flashcards (filtrées pour santé mentale / droits sociaux)
flashcards.forEach((card, idx) => {
  if (!card.Question || !card['Réponse']) return;
  
  // Filtrer les questions fiscales pures (garder seulement celles pertinentes)
  const question = card.Question.toLowerCase();
  const isRelevant = 
    question.includes('santé') ||
    question.includes('mental') ||
    question.includes('soin') ||
    question.includes('incapacité') ||
    question.includes('inami') ||
    question.includes('mutuel') ||
    question.includes('social') ||
    question.includes('empowerment') ||
    question.includes('citoyen') ||
    question.includes('bruxelles') ||
    question.includes('ludification') ||
    question.includes('agence') ||
    question.includes('psybru') ||
    question.includes('télé-accueil');
  
  if (isRelevant) {
    unifiedGraph.flashcards.push({
      "@id": `https://nyxo.brussels/flashcard/fc_${idx}`,
      "@type": "Question",
      "text": card.Question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": card['Réponse']
      }
    });
  }
});

// Helper pour mapper les types d'entités vers schema.org
function mapEntityType(type) {
  const mapping = {
    'institution': 'GovernmentOrganization',
    'plateforme': 'Organization',
    'service': 'Service',
    'ssm': 'MedicalOrganization',
    'ihp': 'ResidentialComplexm',
    'msp': 'ResidentialComplex',
    'hopital': 'Hospital',
    'equipe_mobile': 'MedicalOrganization',
    'asbl': 'NGO',
    'cpas': 'GovernmentOrganization',
    'club': 'Organization',
    'gam': 'Organization',
    'concept': 'DefinedTerm',
    'decret': 'Legislation',
    'financement': 'MonetaryGrant',
    'indicateur': 'DefinedTerm',
    'methode': 'HowTo',
    'programme': 'Project',
    'web_resource': 'WebPage',
    'bassin': 'AdministrativeArea',
    'organization': 'Organization',
    'association': 'Organization'
  };
  return mapping[type] || 'Thing';
}

// Mettre à jour les statistiques
unifiedGraph.statistics = {
  entities: unifiedGraph.entities.length,
  relations: unifiedGraph.relations.length,
  zones: unifiedGraph.zones.length,
  flashcards: unifiedGraph.flashcards.length
};

// Écrire le fichier unifié
fs.writeFileSync(
  path.join(__dirname, '../public/nyxo-unified.json'),
  JSON.stringify(unifiedGraph, null, 2),
  'utf8'
);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  NYXO Data Unifier - "One Ring to rule them all"             ║
╠══════════════════════════════════════════════════════════════╣
║  ✓ Zones:      ${String(unifiedGraph.statistics.zones).padEnd(6)} (communes bruxelloises + régions)  ║
║  ✓ Entités:    ${String(unifiedGraph.statistics.entities).padEnd(6)} (organisations, services, concepts) ║
║  ✓ Relations:  ${String(unifiedGraph.statistics.relations).padEnd(6)} (liens entre entités)              ║
║  ✓ Flashcards: ${String(unifiedGraph.statistics.flashcards).padEnd(6)} (questions d'apprentissage)        ║
╠══════════════════════════════════════════════════════════════╣
║  Output: public/nyxo-unified.json                            ║
╚══════════════════════════════════════════════════════════════╝
`);
