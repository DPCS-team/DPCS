Title: Clustering and classification of application's error messages for offline retrieval of an existing solution. Preliminary research.
--------------------------

Abstract 
--------------
Small technical problems with basic linux applications and the operating system itself are currently a major blocker for non-technical people to use a linux-based operating systems. The paper provide an initial research on usage of machine learning algorithms to cluster similar problems (with the same solution) that multiple users are struggling with into a bucket and propagate an already existing and confirmed by the community solution found by a few of them to the rest. 

Introduction
--------------------------
One of the common problems with using linux-based operation system is very limited time of developers that create applications and system components. They are usually working on them as a community service job, after hours or in order to gain experience with programming. The consequence of that is long time between catching a bug and releasing a patch. A great example is one of the author's application - Clicompanion - that had a simple critical problem causing it to crash on start for more than 4 years (2012 - 2016) - and still being downloaded on average by 1 person daily during this timeframe. [14]

Many times, more experienced people are fixing applications itself, using simple scripts or patches. However, due to the previous problems, reviewing them and integrating with a specified application is a slow and problematic process. We decided to consider a simple solution as a bash script without environment dependencies containing no more than 50 lines, possibly requiring administrator rights to execute. As a problem we consider a failure of execution of a program and up to last 50 lines of the program output, including the error code, name of the program, and system configuration.

In this paper, we are going to adopt a novel machine learning techniques to make this process automatic, more community-driven and easier, by collecting anonymized and voluntary provided information about the problems that users are having, clustering problems into buckets of similar problems using the Affinity Propagation algorithm and creating an incremental, offline neural network model that can match new problems with existing ones.

As an addition, non-intrusive tools were created to collect and retrieve solutions created by the community, to perform the experiments and publish the results of the work to broad audience.

For the initial research, we have selected two algorithms as the most promising in terms of computational power demand and quality of results. The first one is a semi-supervised version of Affinity Propagation (AP) described in the "Text Clustering with Seeds Affinity Propagation" paper [12] to be used for clustering of problems into buckets, and the second one is a classical neural network trained on pairs (error, bucket) created by the previous algorithm. 
	
Related work
--------------------------

The existing work in the area is mostly focused on heuristic. The Windows Error Reporting system (WER) serves a slightly different purpose than our project. Its main goal is to help debugging Microsoft products by gathering error data from users. WER aggregates error reports that are likely caused by the same bug into buckets. The goal of the bucketing algorithm is to maintain a property: one bug per bucket and one bucket per bug. It's using two stages. The first one named labelling happens on the users machine. Errors are assigned to buckets based on basic data avaliable at the client. Its goal is to find the general cause of the error. The second stage, clustering, is executed on the server. Errors are placed in new buckets based on further crash data analysis. Its goal is to analyze the labeled error data more deeply and find a specific cause of the problem. Both stages are using heuristics. [3]

Our system have similar construction, but the main difference is that we are going one step ahead and focusing on instantly providing a solution, while Microsoft's focus in on providing informations to help professional programmers to debug and resolve the problem. Additionally, WER is much more intrusive. It can collect full memory dump, memory dumps from related programs, related files or other data queried from the reporting system. The WER system is propiertary and there is no detailed analyzis available. [3]

Another solution is provided by Red Hat, named Red Hat Analyze / Diagnoze. It also is using two modes. The first one - Analyze - it's analysing a single file for symptoms of error, and the second one - Diangoze - is sending a file, directory or plain text to being analyzed by the server. One of their main purposes is to automatically investigate kernel crashes to reduce time spent by their supporting engineers on analyzing a help request. [13]

The other usecase of this system is to scan a Tomcat, JBoss, or Python log file and try to understand a reason of the failure - and provide a solution if the problem is trivial. Unfortunatelly, details about the Red Hat Analyze / Diagnoze system implementation are a property of the Red Hat Inc. [13].

Another projects are related to log processing only: Pulse - learns from log files and searches for anomalies. [16] Entropy - Uses natural language processing for parsing logs. [17] Clusebox - machine learning over logs for automated troubleshooting of performance problems. [18] There is also a previous work available, that applies machine learning techniques to do automated log analysis. Compares several variants of clustering, artificial neural network algorithms and data preprocessing. [19]

Data preprocessing
--------------------------

The same preprocessing techniques was used to convert raw error log into feature vectors for both clustering and classification algorithms. The error log is a set of 8 values: name, runtime arguments and version of the crashed application, exit code, kernel and distribution version, installed packages in the system and stderr output consisting of several lines of text. We have assumed the apt package manager and standard debian packages to be used on the system, as the most popular ones. 

The first 5 informantions don't need any preprocessing. They are inserted as a string / numerical value into the feature vector directly. The installed packages divided into the TOP200 popular packages (by Debian popular contest application) and the rest, and only the first group have been considered in order to reduce compuational expensivness of the clustering. [15] Then, a 200 binary vector have been created, where each column is representing one of the TOP200 packages, and the value inside is a version instaled on the system.

The stderr output, the most important information along with name and version of crashed application, was stripped of out stop-words, punctuation and all letters was converted to lowercase. Then, a vector of bigrams have been created out of it.

In order to comply with the selected algorithm requirements, two vectors of features was created – one with less important features, for which we have considered a whole output of the program bigrams and installed packages on the system, and one with more important - application name, runtime arguments, version, last 5 lines of output bigrams, distribution and kernel versions and exit code.


Clustering algorithm  
--------------------------

As the main criteria for the clustering algorithm selection, we have considered speed of execution, processing structural information and ability to predict the number of clusters. The AP algorithm is satisfying all of the three requirements. In the analysis below, the specific AP algorithm designed by Renchu Guan, et all. [src] will be considered. 

That prepared sets of each vector for each error was used for a nightly clustering using the AP algorithm.

Classification algorithm
--------------------------




Platform overview
--------------------------

The DPCS is composed in a server/client architecture. A simple http server is receiving and sending JSON queries, for the initial research a single machine is enough. Daily during night, a clustering algorithm initiated by a CRON job is run through the database of problems, assigning them to proper categories.

The client is a terminal plugin applied to the Clicompanion tool. Clicompanion is an application designed for people learning how to use console, so a natural target group for the system. It contain an offline neural network model, trained on data from  

One of the requirement for the client is to work in an offline mode. That's necessary for securing users privacy, that their data is not being send outside without their explicit permission. We have resolved it by having two types of users. Most of them would have an offline model on their computer, that's created by the data collected from the smaller part that have decided to send their data for a more accurate diagnosis on the server.

We have considered an approach to automatically listen on all terminals for the programs that have crashed with error, but decided to give up because of the intrusiveness and technical challenges.


Heuristics
----------

In order to exclude a lot of errors coming from simple mistype of the application name or parameter, we have integrated an already existing tool – Thefuck - to automatically recognize, when an user will make a simple mistake. It's a method that we use to clean our enquires before we feed them to the rest of pipeline [src4]


System lifelong logs approach

This approach can be used for finding an automatic solution for already clustered error. A human interaction will not be necessary in the process.
Firstly, for each insider, we will store a list consisting all actions taken starting after their operating system installation. An action could be:
0. Operating system installation [distribution, version, flavor]
1. Package installation via apt-get.
2. Changing a DPCS protected configuration file. [which lines was changed]
3. Execution of a DPCS protected application [return code, parameters, log]

They will be stored as “SLL/username-computer.ss” structured streams on the HDFS and will be incrementally updated every a few days.
Daily, during the night, SLL algorithm will look at the action files and try to cluster the errors. If a specified error will have a large enough representation, the SLL algorithm will try to find a representation of two classes:
1. Actions “run the application” resulting with a specified error.
2. Actions “run the application” resulting with a success

The next step will be to discover statistically significant differences in each route from system installation to a described action between these groups. We will start with checking, what package always was installed before a successful action and what package was always missing before a
failed action.
If the difference could be reduced to a single package, we have a solution: An user have to install this package in order to make this command work without an error.

Example
Let's look at the SLL algorithm on a simple example from my personal work.

I've tried to convert an ipython notebook to a PDF format, using a command:

nbconvert --format=pdf lecture.ipynb

It have failed with an error:
 [NbConvertApp] CRITICAL | Bad config encountered during
 initialization:
  [NbConvertApp] CRITICAL | The 'export_format' trait of a
  NbConvertApp instance must be any of ['custom', 'html', 'latex',
  'markdown', 'python', 'rst', 'slides'] or None, but a value of
  u'pdf' was specified.

Hopefully, this log could be easily clustered, because it's generic (doesn't contain any filesystem path, user information ect…).
Suppose there is 100 previously seen instances of this error, and 10'000 correct command execution with this parameter “--format=pdf”
In 95% of previously seen error instances, a package texlive-latex-extra was not installed.
In 98% of successful command executions, a package texlive-latex-extra was installed.
It's the only statistically significant difference between action routes of these two groups. 
Based on that, the SLL algorithm will generate proposed solution as follows:
“sudo apt-get install texlive-latex-extra”
This is just a simplification of the algorithm. It can be extended in many ways.

Examples 
--------------------------
Usecases 

User doesn’t have required software:
¬ example: while coding software engineer needs python3 but has python2.
¬ solution: install required software
¬ for whom: all ubuntu users
2. User have some problem with hardware
¬ example: user swap is overloaded
¬ solution: kill process which takes more memory than others
¬ for whom: user who never heard about swap, kernel or memory
3. User make some typo in console
¬ example: “sudo atp¬get” instead of “sudo apt¬get”
¬ solution: run command again without typo
¬ for whom: all users
4. Update failed
¬ example: repository address changed and computer doesn’t know new address
¬ solution: find new address
¬ for whom: all users
5. Security problems
¬ example: system was infected with malware
¬ solution: remove the malware automatically or inform user about suspicious behavior
and let him decide
¬ for whom:
6. Regressions and new bugs in new version of packages
¬ Example: new version of some package has a bug which occurs only in some
specific circumstances
¬ Solution: DPCS learns which configurations cause the bug and informs developers
about them
¬ for whom: developers of packages


Results 
-----------------------------------

An initial set of 100 partly-artificial examples of 20 problems was created by looking at the popular problems from StackOverflow website. These problems are: <LIST OF PROBLEMS> The clustering algorithm was able to correctly cluster <> problems with the <> Davies-Bouldin score. After that, a classification algorithm was trained on this data and received <>% accuracy.

After successful initial verification, a test on approx. 1000 user have been performed. The initial model have been trained on the previously described initial-set. The users were invited to join testing via Facebook adverts targeted to people interested in learning linux (followers of fanpages for linux beginners). We have received <> queries to the server and <> reports that the problem wasn’t solved. Additionally in <> case, the offline model had too low confidence to provide a solution.


The other methods of assessment worth considering are:
* Counting time from giving solution to the user to his (positive or negative) evaluation of results. The shortest time means that solution (even if wrong) was more understandable.
* Counting users resigning from using given version of solver (but this may not be possible with alpha version)



Future experiments
------------------

- Algorithm: Analyzing users commands after error in order to detect a possible solution. 
- Platform: Providing a platform for manual solution inserting by volunteers.
- Preprocessing: Normalization of system paths (~home), /opt/bin, /bin/ etc - heuristics
- Preprocessing: Converting to lowercase, 's, timestamps, PII (emails, passwords) removal (library?)
- Preprocessing: Translations of messages.
- Preprocessing: Using TF-IDF over bigrams.
- Clustering: Including system configuration (versions of every installed package).
- Clustering: Usage of paragraph2vec (extension of doc2vec).
- Clustering: Usage of spectral clustering.
- Data collection: Stack overflow crawler.
- Data collection: https://api.stackexchange.com/docs + https://archive.org/details/stackexchange - 500 MB of AskUbuntu data.
- Automatic traige: Automaticly opening a question on StackOverflow via https://api.stackexchange.com/docs/create-question


Motivation and the production deployment plan
---------------------------------------------

The idea of DPCS was created during a meeting of Canonical managers with the University of Warsaw Machine Learning Research Group (UWMLRG) Board in 2015. After discussion about different machine learning projects, DPCS was selected as a problem that is interesting to solve and have a possibility to make a real big impact on milions of people currently using Ubuntu as their primary operating system.

The DPCS was the main project for the UWMLRG during the academic year of 2015/2016, where most of the contributions and ideas for the initial research have come form.

The main goal is to integrate the DPCS into public Ubuntu releases as a default-enabled standard console plugin with an offline classification model, periodically updated via the standard package updates. For those who will decide to be more involved, they will be able to select the online mode. In the online mode, the classification input will be sent to the server for a classification on a larger model + clustering for finding new issues. This mode will be expanding the current knowledge of problems.

This is a significant ML application contribution, with the possibility of enabling more people to use free operating systems and reducing the entry level investment for people who want to start learning how to use a computer. In turn, this will help with overcoming massive transition of workforce from manual jobs to IT sector, caused by great improvement of artifical inteligence.


Bibliography
--------------------------
[1] http://www.psi.toronto.edu/affinitypropagation/FreyDueckScience07.pdf 

[3] http://research.microsoft.com/apps/pubs/default.aspx?id=81176

[4] https://github.com/nvbn/thefuck

[5] http://uu.diva-portal.org/smash/get/diva2:667650/FULLTEXT01.pdf

[6] https://www.youtube.com/watch?v=P-LEH-AFovE

[7] http://arxiv.org/pdf/1507.07998v1.pdf

[8] https://dl.acm.org/citation.cfm?id=1148241&dl=ACM&coll=DL&CFID=759388251&CFTOKEN=72271786

[9] http://arxiv.org/pdf/1405.4053v2.pdf

[10] http://arxiv.org/pdf/1507.07998v1.pdf

[11] Delbert Dueck; Brendan J. Frey (2007). Non-metric affinity propagation for unsupervised image categorization. Int'l Conf. on Computer Vision.

[12] Renchu Guan; Xiaohu Shi; Maurizio Marchese; Chen Yang; Yanchun Liang (2011). "Text Clustering with Seeds Affinity Propagation". IEEE Transactions on Knowledge & Data Engineering. 23 (4): 627–637. doi:10.1109/tkde.2010.144.

[13] https://access.redhat.com/articles/445443

[14] TODO: Write an article about the Clicompanion problem.

[15] Debian popular vote http://popcon.debian.org/main/by_vote

[16] https://github.com/gophergala2016/Pulse 

[17] https://github.com/jbowles/entropy

[18] https://www.usenix.org/legacy/event/wasl08/tech/full_papers/sandeep/sandeep_html/

[19] http://uu.diva-portal.org/smash/get/diva2:667650/FULLTEXT01.pdf
