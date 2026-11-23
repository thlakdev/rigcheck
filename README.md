# rigcheck
PC &amp; laptop hardware compatibility checker and community review hub. Enter your specs once to spot bottlenecks across games and software, save multiple rigs, and control public profile visibility—built with React, Vite, and Tailwind CSS on a modular service layer ready for Supabase.
# RigCheck — Can You Run It?

RigCheck is a web application built to take the guesswork out of PC and laptop hardware compatibility. Instead of cross-checking spec sheets across five different tabs—or downloading a 60GB title only to hit a RAM or GPU bottleneck—users enter their system specs once to get an instant compatibility breakdown across games, IDEs, and creative software, backed by real-world hardware reviews from the community.

* **Core Features:**

PC Spec Builder & Saved Rigs:
Searchable CPU and GPU selectors mapped to internal benchmark scores, alongside RAM, storage, and OS inputs. Save and switch between multiple device profiles (e.g., primary desktop, college laptop).
Compatibility Matching Engine:
Evaluates entered specs against minimum and recommended requirements, categorizing titles into Recommended, Minimum (Playable) and Cannot Run,while calling out the exact hardware bottleneck.
Device & Component Reviews: 
Browse hardware ratings, read performance tags (thermals, value, gaming output), and create, edit, or delete community reviews for individual components or full laptop/PC builds.
Dashboard & Granular Privacy Controls: 
Centralized view for saved setups, compatibility check history, and submitted reviews—with per-rig, per-spec, and per-review toggles to customize what shows up on your shareable public profile.

* **Architecture & Scalability:**

RigCheck is intentionally structured around a decoupled service layer (`RigCheckDataService` and `RigCheckAuthService`) and feature-based folders so the frontend stays independent of the backend implementation:

Phase 1 (Current): React, Vite, Tailwind CSS v4, React Router, automated CI/CD deployment via GitHub Actions to GitHub Pages.
Phase 2 (Planned): Migrating the service layer to Supabase (PostgreSQL + Auth + Row-Level Security) and expanding the hardware/software benchmark catalog without rewriting UI components.

* **Live Demo:**
