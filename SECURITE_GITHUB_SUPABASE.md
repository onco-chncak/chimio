# Securite GitHub et Supabase - ChimioPro

## Ce que GitHub contient

GitHub contient uniquement le code de l'application, les styles, les modeles et la documentation.

Ne jamais envoyer sur GitHub :

- les fichiers `Sauvegarde_ChimioPro_*.json` ;
- les exports contenant `chncak_patients`, `chncak_biologie`, `chncak_rdv`, `chncak_protocols`, `chncak_suivi` ;
- la cle Supabase `service_role` ou toute cle secrete ;
- les mots de passe reels des utilisateurs ;
- les fichiers `.env`.

Le fichier `.gitignore` bloque les noms de fichiers les plus dangereux, mais il ne remplace pas la verification humaine avant chaque commit.

## Controle rapide avant publication

Avant chaque push GitHub :

```powershell
git status -sb
git diff --stat
git grep -n "service_role\|sb_secret\|PRIVATE KEY\|Sauvegarde_ChimioPro"
```

Si un fichier de sauvegarde patient apparait dans `git status`, ne pas committer.

## Supabase : principe de securite

La cle publique `sb_publishable_...` peut etre visible dans le navigateur.
La securite des donnees repose sur :

- authentification obligatoire des utilisateurs ;
- Row Level Security activee ;
- policies qui refusent l'acces au role `anon` ;
- aucune cle `service_role` dans le code public.

Depuis la version `20260521i`, l'ecran principal de connexion utilise Supabase Auth comme authentification securisee. Les anciens mots de passe publics de demonstration ont ete retires du code.

## Creation des comptes utilisateurs

Procedure recommandee :

1. Creer l'utilisateur dans Supabase Authentication avec son email professionnel.
2. Donner un mot de passe temporaire, puis demander a l'utilisateur de le changer selon la procedure interne.
3. Renseigner le role de l'utilisateur dans Supabase `user_metadata`, champ `role`, avec une valeur parmi :
   - `admin`
   - `medecin`
   - `pharmacien`
   - `infirmier`
   - `biologiste`
   - `secretaire`
4. L'utilisateur se connecte dans ChimioPro avec son email Supabase et son mot de passe.

Depuis la version `20260521j`, la connexion principale Supabase connecte aussi automatiquement le module Cloud. L'utilisateur ne doit plus ressaisir son email et son mot de passe dans le panneau Cloud apres connexion.

Le bouton `S'inscrire` de ChimioPro sert a deposer une demande interne. Il ne cree pas tout seul le compte Supabase : l'administrateur doit ensuite creer l'utilisateur dans Supabase Authentication et lui attribuer le role correspondant.

Important : dans Maintenance, le bouton `Valider` approuve seulement la demande dans ChimioPro. Cette validation locale ne donne pas encore acces a l'application. Le collegue pourra se connecter uniquement quand le meme email existe aussi dans Supabase Authentication avec le bon `raw_user_meta_data`, par exemple :

```json
{
  "role": "medecin"
}
```

Compte administrateur de demarrage :

- `onco.chn.cak@gmail.com` est reconnu comme admin de demarrage dans le code public.
- Cette information n'est pas un mot de passe ; elle sert seulement a donner le role admin a ce compte apres authentification Supabase reussie.

Important : ne pas partager un compte unique entre plusieurs collegues. Chaque utilisateur doit avoir son propre compte Supabase.

## SQL de controle RLS recommande

A executer dans Supabase SQL Editor pour la table `app_settings`.

```sql
alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
drop policy if exists "app_settings_insert_authenticated" on public.app_settings;
drop policy if exists "app_settings_update_authenticated" on public.app_settings;
drop policy if exists "app_settings_delete_authenticated" on public.app_settings;

create policy "app_settings_select_authenticated"
on public.app_settings
for select
to authenticated
using (true);

create policy "app_settings_insert_authenticated"
on public.app_settings
for insert
to authenticated
with check (true);

create policy "app_settings_update_authenticated"
on public.app_settings
for update
to authenticated
using (true)
with check (true);

create policy "app_settings_delete_authenticated"
on public.app_settings
for delete
to authenticated
using (true);
```

Important : ne pas creer de policy `to anon` sur `app_settings`.

## Limite actuelle a connaitre

ChimioPro synchronise actuellement un snapshot partage dans `app_settings`.
Cela veut dire que les utilisateurs authentifies autorises au projet partagent la meme base de donnees metier.

Ce modele est acceptable pour une petite equipe hospitaliere autorisee, mais il ne fait pas encore de cloisonnement patient par utilisateur.

Pour un niveau plus strict, il faudra plus tard passer a des tables separees :

- `patients`
- `protocoles`
- `rdv`
- `biologie`
- `preparations`
- `transfusions`
- `audit_log`

avec des policies par role et un journal d'audit non modifiable.

## Sauvegardes

Procedure minimale recommandee :

- sauvegarde JSON locale chaque fin de journee ;
- stockage dans un dossier protege hors GitHub ;
- une copie externe securisee chaque semaine ;
- test de restauration une fois par mois ;
- ne jamais envoyer une sauvegarde patient par messagerie non securisee.

## GitHub public : ce que peut voir un tiers

Un tiers peut voir :

- le code HTML, CSS, JavaScript ;
- les modeles ;
- la documentation ;
- le lien Supabase public/publishable.

Un tiers ne doit pas pouvoir voir :

- les patients ;
- les bilans ;
- les rendez-vous ;
- les protocoles sauvegardes patient ;
- les stocks reels si vous choisissez de les garder uniquement dans Supabase/localStorage ;
- les sauvegardes JSON.

Si une sauvegarde patient est envoyee par erreur sur GitHub, il faut la supprimer du depot et de l'historique Git, puis considerer que les donnees ont ete exposees.
