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
