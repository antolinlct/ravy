# Documentation base de donnée

## Vue d'ensemble
La base de données RAVY a pour objectif de structurer l’ensemble des données nécessaires au suivi économique et opérationnel d’un établissement de restauration.  
Elle centralise les informations issues des factures fournisseurs, des fiches recettes, des coûts matières et des marges, afin de permettre un pilotage complet du levier “mieux acheter, mieux produire, mieux vendre”.

Les élements qui vont suivre doivent être revu et optimisé pour créer une base de donnée saine et efficace pour les utilisateurs et le concepteur du logiciel.

## Tables

# Table: 'user'
Cette table represente un utilisateur de ravy. Il possède un compte a son nom. L'utilisateur peut avoir plusieurs niveau d'accès en fonction de ce qui lui est accordé. Un utilisateur par défaut est de niveau 'administrateur' et peut avoir plusieurs établissements. Il peut aussi ajouter des membres dans son équipe et leurs donner des accès de plusieurs niveau sur l'ensemble des établissement qu'il a sous gestion ou bien seulement une partie.

# Table: 'establishment' (a créer)
Cette table represente un établissement, ce qui est l'équivalent d'un restaurant. Aussi important qu'un utilisateur, c'est lui qui fixe les données a montrer a l'utilisateur. L'ensemble des données (factures, prixs, variations, recettes) sont associé a un établissement gérer lui même par un 'user'. On relie tout a l'établissement afin de ne pas avoir de donner transmise entre les autres établissement que peut détenir un user. Chaque établiseement fonctionne comme un vase clos. C'est au niveau de l'établissement que l'on va gérer les préferences tels que les prix de ventes conseillé, les paramétrages des notifications par sms, les adresse emails a valider pour la transmission de facture par mail etc etc.

# Table: 'user_statut'
Cette table est un équivalent des options set de chez bubble.io. Elle liste tous les niveau d'accès possible (fixé par moi et non modulable par chaque utilisateur) qu'un 'user' peut accordé a chacun de ses employés.

# Table: 'country'
Cette table est aussi fixe, seul moi peut la modifier. Elle represente le pays de l'utilisateur et viens préciser le nom du pays dans lequel l'utilisateur a son exploitation, le niveau de tax a appliquer sur stripe ou encore le symbole de la devise. Pour l'instant je ne prend en charge que la FRANCE mais dans une vue d'évolutivité du logiciel je prevois une table a cet effet.

# Table: 'vat'
Cette table est relié a la table 'country' et vient préciser les deifférent niveau de taxe. En effet en restauration plusieurs niveau de tva son applicable en fonction de la nature du produit vendu. 'vat' viens donc préciser le montant de chacune de ces taxes en pourcentage et en aboslu pour faciliter les calculs.

# Table 'imports_email'
Cette table viens lister pour chaque 'établissement' les emails a associer a l'établissement. Cela me permet de savoir lorsque je recois une factures sur 'factures@ravy.fr' a quel etablissemetn associé la facture. Je regarde le mail qui m'a envoyé la facture, je vais chercher l'établissement qui dans ses 'imports_emails' le contient et je lui associe la facture. Donc un établissement ne peut pas contenir un imports_email déjà utilisé par un autre établissement. ATTENTION, a terme cette table n'aura plus d'utilité car chaque établissement aura une adresse mail personnalisé type 'etablissment_name.factures@ravy.fr' ce qui lui permettra de transmettre cette adresse a ses fournisseur, ainsi je saurais que toutes les factures envoyé à 'etablissment_name.factures@ravy.fr' sont a relié a cet établissement en question.

# Table: 'variation_notifications'
Cette table qui est au niveau de l'établissement viens préciser les paramètres des notifications par sms que recois le ou les utilisateurs de cet établissement. Il précise si les notifications sont active ou non et le niveau minimum de la variation qui doit déclencher le sms ( totues, plus ou moins 5% et plus ou moins 10%).

# Table: 'princing_strategy'
Cette table concerne uniquemnt la donnée 'prix de vente conseillé' qui apparait lors de la création de la recette. L'utilisateur peut au niveau des paramétrages de sont établissemnet definir sa méthode de calcul (% de marge ou multiple ciblé) ainsi que le montant a cibler (exprimer en pourcentage pour la méthode 'pourcentage' et en multipliateur pour la méthode 'multiplicateur')

# Table: 'live_score'
Cette table qui est au niveau de l'établissement viens préciser les score live mis a cet etablissmeent, qui sont des score d'optimisateion que je lui accord en fonction de multiples paramètres. Ces lives scores peuvent être mis à jour par différentes opération (mise à jour de recette, nouvelle facture importé, etc). Elle contient les 4 scores que je lui donne a savoir : score achat, score recette, score financier et le score global de son établissement.

# Table: 'subscription'
Cette table gère les abonnement stripe de chaque utilisateur avec date de debut, date de fin, statuts etc etc. Il précise via les champs 'invoice_count' et 'recipe_count' le nombre total de recette qu'il peut créer en fonction de son plan et le nombre de factures mensuels qu'il peut analyser par mois grâce a son plan.

# Table: 'ticket', 'ticket_status' & 'tiket_type'
Ces tables gère les tickets créer par un utilisateurs. Un ticket dans ravy, c'est lorsqu'une facture est mal analysé par notre logiciel. L'utilisateur peut créer un ticket ou il envoie sa factures, un sujet pris parmis une liste (erreur de montant, mauvaise détection ou autre) ainsi que des commentaires (optionel) ce qui l'envoie a notre équipe en interne pour résoudre le prioblème. Le ticket a différent status en fonction de son niveau de résolution (de envoyé à résolu par exemple).

# Table: 'invoices'
Cette table gère les factures importés sur le logiciel. Elle contient les champs issu de l'analyse de notre OCR (ou autre technologie) comme la date, le fournisseur, les montant total (ht, tca et ttc) etc etc.

# Table: 'supplier', 'supplier_label' & 'supplier_alias'
Cette table represente les fournisseurs. Un fournisseru est associé a un 'supplier_label', c'est la catégorie dans laquelle il appartient (aliemntaire, boissons, charges fixes, charges variables, autrs, etc.). Les 'supplier_alias' sont utilisé pour permettre à l'utilisateur de créer des variations du nom du fournisseur, les alias fonctionne de la manière suivante : L'utilisateur importe 2 factures du même fournisseur "METRO CASH & CARRY", sur la première facture, notre tech detecte le fournisseur avec le bon nom mais sur la deuxième elle va détecter que "METRO CASH" ce qui nous fait techiquement 2 fournisseur différent, et va donc créer 2 fournisseur. Quand ça arrive l'utilisateur va créer l'alias "METRO CASH" dans le fournisseur "METRO CASH & CARRY" ce qui fait que chaque nouvelle facture ou je détecte "METRO CASH" je saurais qu'en réalité il s'agit du fournisseur "METRO CASH & CARRY" et donc réduire les erreur en interne. d'analyse. Cette table peut etre supprimé  si on developpe un algo qui associe a un fournisseur le nom detecté sur une base de pourcentage de similarité et autre par exemple, ou si on peut modifier le fournisseur d'une facture et recalculé toutes les donénes découllant de cette modifications. Même si je la trouve utile en cas de pépin.

# Table: 'market_supplier'
Cette table reprend un 'supplier' classique pour le rendre en version publique. En gros je propsoe une fonctionnalité ou l'utilsateur peut voir sur certains fournisseur les prixs payé par ses concurents le 'market_supplier' regroupe donc une liste de 'supplier' qui eux sont privé pour savoir que les prixs sont comparables entre les utilisateurs car il s'agit du même fournisseur en réalité.

# Table: 'master_article' & 'article'
La table 'article' represente la liste des articles issu d'une facture. Il est associé a un fournisseur et a une facture. Pour chaque ligne d'une facture on a donc un 'article'. La table 'master_article' represente l'article maitre des sous article c'est lui qui va gérer une liste d'article pour presente un hitsorique de prix et de tracabilité. Ce fonctionnement me permet d'associe chaque article créer a un article maitre pour savoir qu'il s'agit d'un article déjà detecté sur une autre facture et donc tracer son historique. Le champs 'no_space_name' du 'master_article' represente le nom de l'article analysé sans espace, sans formatage et en minuscule. C'est ce champs que je compare pour savoir si l'article a déjà été importé et donc l'associé a un master article déjà existant ou non. Le nom de l'article sans formattage me permet de réduire les erreurs d'analyse lié a une mauvaise detection des espace, des majuscule ou autre.

# Table: 'market_master_article' & 'market_article'
Sur le même concept que 'market_supplier' ce sont les version publique entre chaque utilisateur des article et des master articles créer aun niveau d'un utilisateurs. Ce sont ces informations la qui sont partagé pour permettre de comparé ses prix d'achats a ceux du marché.

# Table: 'variations'
Cette table est alimenté lors de la création des articles. Il regroupe pour chaque nouvelle facture importé les variations qui sont parvenus comparé aux anciens prix. C'est sur cette base que je me fixe pour envoyer les sms a l'utilisateur.

# Table: 'recipe' & 'history_recipe'
Cette table contient l'ensemble des recette qui sont créer. Elle contient une liste de 'history_recipe' qui retrace toute les variations de prix ou autre qu'a fait l'utilsiateur pour tacer l'évolution de ses données (marge, prix d'achat, etc). Une recette peut être vendable ou non vendable (mayonnais non vendu directement au client donc 'non vendable' alors que le burger est lui directement vendu au client donc 'vendable'). Elle peut être en brouillon ou non. Une recette peut avoir un nombre de portion qu'elle permet de faire ainsi que le poids (optionel pour le poids) que permet de faire cette recette. Par exemple, une recette faite pour une assiete n'aura qu'une seul portion. Par contre, un cuisinier qui prépare une tarte au citron, comme il vend a la part et qu'il divise sa tarte en 8 parts, et bien elle aura 8 portions. Cela permet de ramener le cout d'achat a la portion, car le prix de vente est le prix de vente d'une seul portion. Les 'history_recipe' sont créer a chaque nouvel import de facture pour recalculer le cout d'achet et les autres info basé sur le prix des ingrédients mis à jour. Idem quand le user modifie la recette, ça créer un nouvel historique a date de modification.

# Table: 'category' & 'sub_category'
Cette table regroupe toute les catégories et sous catégorie auquel peuvent appartenir une recette. Il s'agit d'une liste fixe que seul moi peut modifier. Les sub-category sont définis via un parents 'category' et ne sont pas permutable. En gros chaque catégorie a sa propre liste de sub category.

# Table: 'global_margin', 'global_category_margin' & 'global_subcategory_margin'
Ces tables reprensente les marges moyennes pour l'ensemble des recettes d'un établissement. Comme leurs nom inque,  il y a une marge moyenne basé sur l'ensemble des reccettes, une autre par catégorie et une autre pour chaque sous catégories. Ces marges moyennes sont mise à jour a chaque import de facture ou de modification de recette pour avoir un historique de l'évolution des marges de l'établissement.

# Table: 'ingredient', 'history_ingredient' & 'ingredient_type'
Ces tables reprensente les ingredients que l'utilsateur créer. Voici le fonctionnement : quand l'utilsiateur configure une recette, il rajoute un ingrédient qui peut être de 3 type ('ingredient_type'). Soit il créer un ingredient type article, dans ce cas il va rechercher dans les 'master_article' un de ces article, il precise, la quantité ainsi qu'un pourcentage de perte ce qui donne le prix de l'ingredient mis dans la recette. Il peut aussi créer un ingrdient de type autre qui lui ne bouge pas en fonction des factures, c'est juste un cout fixe qui n'évolue pas dans le temps. Utile dans le cas ou il veut ajouter des serviettes ou de la main d'oeuvre mais qu'il s'en fiche de suivre l'évolution du prix car pas utile dans sa configuration. Enfin, il peut créer un article type 'sous-recette'. Cela va chercher dans ses recette déjà créer pour la tranformer un ingrédient et créer une boucle. Par exemple, imaginons qu'il vende une tarte citron, une tarte au pomme et une tarte au framboise. Au lieu de repeter dans les trois recettes la recette de sa pâte à tarte, il crée la recette 'pate a tarte' qu'il met en non vendable. Dans la création de sa tarte au citron, il pourra créer un ingrédient basé sur sa recette 'pate a tarte'. Cela permet de créer une boucle et de simplifier la création et l'analyse. ATTENTION, pour le momenet je ne permet pas de faire plus d'une boucle. Il ne peut pas ajouter dans une recette un ingredient de type 'sous-recette' si cette sous-recette en question contient déjà un ingredien 'sous-recette'. Cela evite de créer des boucles infinies ou ça se recalculerais constamenet car l'une met a jour l'autre etc. Les 'history_ingredient' sont les historique de prix des ingredient qu'il a créer. Ces historiuque sont créer a modification d'un ingredient ou import d'un article qui fait varier le cout de cette ingredient. Pour les cout des ingredients type 'sous-recette', c'est la varaition d'une recette qui va le déclencher. La logique de recalcul est configuré poru tout refaire et mettre à jour correctement.

# Table 'financial_reports'
L'utilsiateur peut pour son établissement créer des rapports financier mensuels. Ces rapports viennent calculer tout un tas de donnée basé sur ses acahts et ses ventes (qu'il indique a la création du financial reports) pour lui faire des rapports type SIG COMPTABLE de manière mensueles. C'est lors de la configuration de ces rapports qu'on va générer des rentrer sur les scores financiers par exemples.

# Table 'financial_recipe' & 'financial_ingredient'
Ces tabels sont associé a des financial reports car ils sont généré a leurs création. Pour faire simple, lorsque l'utilisateur créer un rapports financier il indique son nombre de vente. Pour lui donner des données précise basé sur ces ventes, je transofrme toutes les recettes qui ont des ventes>0 sur le mois du rapports en 'fianncial_recette' ainsi que tous les ingrédient de toute ces recettes vendus en 'financial_ingredient'. Cela me permet de calculer pour chaque recete le chiffre d'affaires générés, le cout total etc et de faire des pondéraiton pour définir les scores financiers. Pour les ingredient financier c'est le même concept.

## Points de vigilance.
Ces tables ont été pensé en fonction des contraintes de bubble.io (la ou j'ai fait la version actuel de mon logiciel), elles ne sont donc pas forcément optimisé. Il ya ennormement de zones d'incertitude d'ou le besoin d'audit en vue de l'optimiser. Il est très important de comprendre la logique d'analsye de l'outil pour penser une base de donné cohérent et evolutive au niveau global.

Au niveau de la gestion des user : Sur bubble.io je ne gère pas le multietablissmeent. Ili faut donc repenser toute cette partie. Un utilisateur peut avoir 2 niveau de facturation (assuré par Stripe), soit au niveau de chaque établissement (chaque établissement paye son abonnement pour lui même) soit au niveau global l(utilsiateur paye via un profil de facturation genre sa holding pour tout ses établissements). Pour les accès employé, il faut faire attention: je veux prévoir une facturation en fonction du nombre d'accès (par exemple 5€ par mois par utilisateur supplémentaires) même si pour le moement je ne veux pas facturer au nombre de siège.

La base de donnée expliqué ne prend pas en compte les elemetns de mon backoffice pour gérer le tout (mais on le fera plus tard c'est pas la prio). Il ne prend pas non plus en compte les nouvelles fonctionnalités que je veux (chatbot IA consultant sur les données de l'établissements), les logs ou tout autre données utiles pour mon logiciel. Il ne prend pas non plus en compte les différentes tables que j'ai (genre 'facture-errors' pour gérer les retour de mon ocr déffectueux et le montrer au user, les tables qui vont gérer les fichier-factures enovoyés a mon ocr et qui vont stocker le rtour api etc).

POINT A NOTER : le formatage des donées (UUID, VARCHAR, TXT, INTEGER et autre) ne sont mis qu'a titre informatif et doivent être revu. Idem pour les liens entre les tables, ils sont pensé car buble requier que A doivent appeller B et que B doivent appeller A pour que ça fonctionne dans les 2 sens.

## Attentes de l'audit
la base doit être simplifiée et normalisée. plusieurs ajustements sont nécessaires pour garantir la cohérence, la scalabilité et la compatibilité avec un backend code pur.

ajouter la gestion multi-établissements
créer une table establishment pour isoler les données par restaurant. toutes les tables principales (factures, fournisseurs, recettes, ingrédients, rapports financiers) doivent contenir un champ establishment_id. cette table servira de pivot pour les règles de sécurité et le multi-accès.

revoir la gestion des utilisateurs
séparer le concept de user (compte global) et d’établissement (restaurant). un utilisateur peut avoir plusieurs établissements. créer une table user_establishment pour gérer les accès, avec rôle (admin, staff). les données personnelles ou liées à la connexion doivent être dans user, pas ailleurs.

simplifier les types et les relations
réduire le nombre de tables secondaires héritées de bubble. supprimer les champs redondants, les listes internes et les dépendances inutiles. standardiser les types de données : utiliser uuid pour les id, numeric pour les montants, timestamptz pour les dates. renommer les champs trop spécifiques bubble pour des noms clairs et constants.

revoir les typages métier
uniformiser tous les montants en numeric(12,2) ou numeric(12,4) selon la précision. vérifier que les taux, pourcentages et ratios ont des décimales cohérentes. convertir les booléens en vrai type boolean. remplacer les champs textuels flous (type, statut, niveau) par des enums simples et cohérents.

clarifier la hiérarchie fonctionnelle
assurer la chaîne de relation complète : facture → article → ingrédient → recette → marge → rapport financier. tous les liens doivent être directs et explicites, sans logique implicite ni champ texte servant de référence.

réviser les contraintes de suppression et intégrité
appliquer on delete cascade sur toutes les dépendances directes (articles liés aux factures, ingrédients liés aux recettes, historiques liés à leur élément parent). ajouter les timestamps created_at et updated_at sur chaque table pour la traçabilité.

revoir la structure utilisateur et droits d’accès
préparer la mise en place des rls (row level security) en basant les permissions sur establishment_id. ajouter un champ role_global sur la table user pour distinguer admin global, consultant, ou staff.