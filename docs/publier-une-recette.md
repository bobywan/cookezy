# Publier une recette sur Cookezy

Tu es autorisé à ajouter une recette sur Cookezy. Envoie un JSON valide à l'API. Tant que la réponse contient `errors`, corrige ces champs et renvoie la recette. N'invente pas une clé : utilise celle fournie par la personne.

## Requête

`POST https://cookezy.vercel.app/api/recettes`

En local : `POST http://localhost:3000/api/recettes`

En-tête obligatoire :

```
Authorization: Bearer LA_CLE
Content-Type: application/json
```

## Corps

`slug` et `id` sont optionnels. Sans `slug`, il est déduit du titre. Sans `id`, il vaut le slug. Sans `image`, ou si le fichier local n'existe pas, la recette s'affiche sans photo.

Valeurs exactes :

- `category` : `entrée`, `plat`, `dessert` ou `snack`
- `difficulty` : `facile`, `moyen` ou `difficile`
- `prepTime`, `cookTime` : entiers, en minutes, 0 accepté
- `servings` : entier supérieur ou égal à 1
- `ingredients` : au moins un objet `{ "quantity": nombre, "unit": "g", "name": "farine" }`. `unit` peut être `""`.
- `steps` : au moins une chaîne, une étape par élément
- `tags` : liste de textes en minuscules, sans `#`

```json
{
  "title": "Tarte aux pommes",
  "description": "Une tarte sucrée, pâte brisée et pommes fondantes.",
  "category": "dessert",
  "difficulty": "moyen",
  "prepTime": 25,
  "cookTime": 40,
  "servings": 6,
  "ingredients": [
    { "quantity": 1, "unit": "", "name": "pâte brisée" },
    { "quantity": 4, "unit": "", "name": "pommes" }
  ],
  "steps": [
    "Préchauffer le four à 180 °C.",
    "Foncer le moule, disposer les pommes et enfourner 40 minutes."
  ],
  "tags": ["dessert", "fruit"]
}
```

## Réponses

Succès `201` :

```json
{ "ok": true, "slug": "tarte-aux-pommes", "url": "https://cookezy.vercel.app/recettes/tarte-aux-pommes" }
```

À corriger `400`, ou déjà publiée `409` :

```json
{ "ok": false, "errors": [{ "field": "steps", "message": "Au moins une étape est requise." }] }
```

Renvoie alors le JSON complet corrigé. Un slug déjà pris demande un autre titre ou un autre slug. Une clé refusée répond `401` : ne réessaie pas avec une autre clé.
