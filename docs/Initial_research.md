Title: Clustering and classification of application's error messages for offline retrieval of an existing solution. Preliminary research.
--------------------------

Abstract 
--------------
Small technical problems with basic linux applications and the operating system itself are currently a major blocker for non-technical people to use a linux-based operating systems. The paper provide an initial research on usage of machine learning algorithms to cluster similar problems (with the same solution) that mulitiple user struggle with into a bucket and propagate an already existing and confirmed by the community solution found by a few of them to the rest. 

Introduction
--------------------------
One of the common problems with using linux-based operation system is very limited time of developers that create applications and system compnents. They are usually working on them as a community service job, after hours or in order to gain experience with programming. The consequence of that is long time between catching a bug and releasing a patch. A great example is one of the author's aplication - Clicompanion - that had a simple critical problem causing it to crash on start for more than 4 years (2012 - 2016) - and still being downloaded on average by 1 person every day.

Many times, more experienced people are fixing applications itself, using simple scripts or patches. However, due to the previous problems, reviewing them and integrating with a specified application is a slow and problematic process. 

In this paper, we are going to adopt a novel machine learning techniqes to make this process automatic, more community-driven and easier, by:

* Collecting anonymized and voluntary provided information about the problems that users are having.
* Clustering problems into buckets of similar problems using Affinity Propagation algorithm.
* Creating an incremental, offline neural network model that can match new problems with existing ones and retrieve solutions.
* Analysing users commands after error in order to detect a possible solution. 
* Providing a platform for manual solution inserting by volunteers.


This is a significant ML application contribution, with the possibility of enabling more people to use free operating system and reducing the entry level investment for people who want to start learning how to use a computer.

Algorithms overview  
--------------------------
To perform initial testing, two algorihms was selected as the most promising.

The first one is the Affinity Propagation algorithm - O(n log n) implementation - , to be used for clustering data received from insiders, from non-covered by Apport applications into separate "problems"

The second one is a classical Neural Network for classifing 'in production' an unknown problem into one of clusters created during previous step (or clusters representing Launchpad bugs).

Evaluating algorithm's efficiency
---------------------------------
There are following issues which must be consider:
We probably want our models to have (and use) option 'don't know the solution' when there are low chances of success. We may have very little test data (for example if model solution can be asses only by human). Wrong decisions may have different scale of consequences – we don’t want to crash computer of our user.

Taking it into account it may be necessary to: 
* Ask alpha users to give us more feedback than 'this (do not) solved my problem'. It may be possible because some of those will be people somehow interested in our work.
* Prepare set of examples for which we would establish good solutions and than check our algorithms on those.
* If our solvers will work not only by suggesting solutions but implementing it, than we could prepare some automatic tests.
* The first of solutions seems easiest (although we probably should do at least some basic tests before giving solver to any user).


The other methods of assessment worth considering are:
* Counting time from giving solution to the user to his (positive or negative) evaluation of results. The shortest time means that solution (even if wrong) was more understandable.
* Counting users resigning from using given version of solver (but this may not be possible with alpha version)


Techincal overview
--------------------------

The DPCS is composed in a server/client architecture. A simple http server is receiving and sending JSON queries, for the initial purposes a single machine was enough. Daily in the evening, a clustering algorithm is run through the database of problems, assigning them to proper categories.

The development of the client was more complicated. We have considered an apporach to automatically listen on all terminals for the programs that have crashed with error, but decided to give up because of the instrusiveness and technical challenges. 

One of the requirement for the client is to work in an offline mode. That's necessary for securing users privacy, that their data is not being send outside without their explicit permission. We have resolved it by having two types of users. Most of them would have an offline model on their computer, that's created by the data collected from the smaller part that have decided to send their data for a more accurate diagnosis on the server.



Preprocessing 
--------------------------
*#PERSON Hubert Tarasiuk*

1) Normalization of system paths (~home), /opt/bin, /bin/ etc - heuristics

2) lowercase, 's, timestamps, PII (emails, passwords) removal (library?)

3) Optional translation

4) Stopwords (?)


Clustering 
--------------------------
Most promising features selected for analysis: word count, word bigram(using TF- IDF and excluding stopwords), package name, package version, version of linux distribution and non-standard packages list.[src5]

Main algorithm

2) Affinity propagation [src1]

Supporting algorithms

To solve our problem of classifying crashes, first we have to think how represent them in our machine learning algorithm. Server gets the report with several fields containing:
1) The name and version of crashed application, along with exit code
2) System version information (kernel and system version, installed modules)
3) stderr output, consisting of several lines of text

First two are easy to feed to the classifier, as they are primarily numbers or proper names (libraries and applications), but the third, as important as them, is just a variable length blob of text. This is where in my opinion paragraph2vec (extension of word2vec) algorithm comes to use.

The idea is to use paragraph2vec algorithm [src9] [src10] on text data, then extend the vector using information from 1) and 2) and then use constrained spectral clustering to obtain labels.

A comparison [src7] shows that the spectral analysis is currently one of the best clustering algorithms, and with constrained SC [src8] we can incorporate prior knowledge. Our data is high-dimensional, but due to the use of spectral clustering it shouldn't be much of a problem (PCA step). We will probably be forced to modify the original approach described in the paper, since our task will require providing “cannotlink constraints” (as opposed to “must-link constrains” described in [src8], indicating that two elements
are in the same cluster).

Paragraph2vec (doc2vec) is already implemented in gensim package (python), I couldn't find any python constrained spectral clustering algorithm, so it is possible we'll have to implement it ourselves.

Heuristics
----------


Thefuck is a tool that automatically recognize, when an user make a mistake writting the script name. It's a method that we use to clean our enquires before we feed them to the NN classifier.[src4]

Short summary of Windows Error Reporting system (WER) based on [src3]

It is based on citations from the original article and shows a general idea behind the system. WER serves a slightly different purpose than our project. Its main goal is to help debugging
Microsoft products by gathering error data from users.

WER aggregates error reports that are likely caused by the same bug into buckets. The goal of the bucketing algorithm is to maintain a property: one bug per bucket and one bucket per bug. To achieve this there are two stages of the bucketing:
● labelling ­ happens on users machine, errors are labeled (assigned to buckets) based on basic data avaliable at the client. Its goal is to find the general cause of the error.

● classifying ­ happens on WER service, errors are placed in new buckets based on further crash data analysis. Its goal is to analyze the labeled error data more deeply
and find a specific cause of the problem.

When an error occurs on user machine, client code automatically collects information and creates an error report. Basic report consists only of bucket identifier.
If a solution to the problem is already known, WER provides the client with URL to the solution. If additional data is needed, WER collects a minidump (a small stack and memory
dump and the configuration of the faulting system). If further data is required, WER can collect full memory dump, memory dumps from related programs, related files or other data
queried from the reporting system.

WER enables statistics­based­debugging ­ all error data is stored in a single database so programmers can mine the database to improve debugging. Programmers can sort the buckets and debug the bucket with most report, can find a function that occurs in most buckets and debug that function. It also helps with finding causes which are not immediately
obvious from memory dumps.

Short summary of bucketing algorithms
Algorithms are based on collection of hueristics. Expanding heuristics increase the number of buckets, condensing heuristics decrease the number of buckets. Expanding heuristics
should not create new buckets for the same bug and condensing heuristics should not put two different bugs into one bucket.
The idea is to classify the records as well as possible in order to save programmers time and maximize their effectiveness in debugging.

Client­Side Bucketing (Labeling)

[FIG4]

It is run on the client when an error report is generated. The goal is to produce an unique label based on local information that is likely to align with other reports caused by the same bug. In most cases, the only data sent to WER servers is a bucket label.

Primary labeling heuristics generate a bucket label from faulting program, module and offset of the program counter within the module.
For example, user­mode crashed are classified according to the parameters:
● application name
● apllication version
● module name
● module version
● offset into module
Additional heuristics are generated for example when an error is caused by unhandled program exception.
Most of the labeling heuristcs are expanding heuristics intended to put separate bugs into distinct buckets. For example, the hang_wait_chain (L10) heuristic walks the cain of threads
waiting for synchronization objects held by threads, starting from the user­input thread. If a root thread is found, the error is report as a hang originating with root thread.

The few condensing heuristics were derived emipirically from common cases when a single bug produced many buckets. For example, the unloaded_module (L13) heuristic condenses
all errors where a module has been unloaded prematurely due to a reference counting bug. Server­Side Bucketing (Classifying)

[FIG5]

The server­side bucketing heuristics are codified in !analyze (an extenstion to Windows Debugger). There were about 500 heuristics dervied empirically.
The most important classifying heuristics (C1 ­ C5) are a part of an algorithm that analyzes the memory dump to determine which thread context and stack frame most likely caused the
error.
There is a number of heuristics to filter out error reports that are unlikely to be debugged (e.g bad memory, misdirected DMA, DMA from a faulty device).

As an another example, kernel dumps are tagged if they contain evidence of known root kits (C11), out­of­date­drivers (C12), drivers known to corrupt the kernel heap (C13) or hardware
known to cause memory or computational erros (C14 and C15).


Classification 
--------------------------

[LINKS]

1) Neural networks

Supporting algorithms

2) Multiclass logistic regression


Solution matching approaches
--------------------------
Stack overflow crawler

## Problem summary
During a meeting with Wojciech Jaworski PhD, we got an idea that it may be really helpful to create a Stack Overflow crawler, that will try to match log parts from user's questions with captured log.

1. Try to find automatically answer
2. Help with logs clustering

## Useful links
* https://api.stackexchange.com/docs - API of AskUbuntu among others.
* https://archive.org/details/stackexchange - 500 MB of AskUbuntu data.

## Proposed solution
Because API implements throttles, I don't see possible use for clustering in scalable system. On the other hand, there exists data dump with number of possible applications. Given error messages and labels in Stack Exchange dump, it seems easy to validate clustering algorithms with this large amount of data. There is also place for heuristic algorithms looking for the same key words - similarly to Mateusz's approach - and apply accepted answer.

Maybe there also could be question creator if error occurs often - but due to question quality restrictions and possible verification issues ([create question issues](https://api.stackexchange.com/docs/create-question)) it could only be semi-automatic and dpcs-team verified.


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
­ example: while coding software engineer needs python3 but has python2.
­ solution: install required software
­ for whom: all ubuntu users
2. User have some problem with hardware
­ example: user swap is overloaded
­ solution: kill process which takes more memory than others
­ for whom: user who never heard about swap, kernel or memory
3. User make some typo in console
­ example: “sudo atp­get” instead of “sudo apt­get”
­ solution: run command again without typo
­ for whom: all users
4. Update failed
­ example: repository address changed and computer doesn’t know new address
­ solution: find new address
­ for whom: all users
5. Security problems
­ example: system was infected with malware
­ solution: remove the malware automatically or inform user about suspicious behavior
and let him decide
­ for whom:
6. Regressions and new bugs in new version of packages
­ Example: new version of some package has a bug which occurs only in some
specific circumstances
­ Solution: DPCS learns which configurations cause the bug and informs developers
about them
­ for whom: developers of packages


Motivation and the production deployment plan
---------------------------------------------

The idea of DPCS was created during a meeting of Canonical managers with the University of Warsaw Machine Learning Research Group (UWMLRG) Board in 2015. After discussion about different machine learning projects, DPCS was selected as a problem that is interesting to solve and have a possibility to make a real big impact on milions of people currently using Ubuntu as their primary operating system.

The DPCS was the main project for the UWMLRG during the academic year of 2015/2016, where most of the contributions and ideas for the initial research have come form.

The main goal is to integrate the DPCS into public Ubuntu releases as a default-enabled standard console plugin with an offline classification model, periodically updated via the standard package updates. For those who will decide to be more involved, they will be able to select the online mode. In the online mode, the classification input will be sent to the server for a classification on a larger model + clustering for finding new issues. This mode will be expanding the current knowledge of problems.


Similar projects
-------------------------- 

# Automatic problem solvers
##### Red Hat Access - Red Hat Access: Diagnose and Red Hat Access: Analyze

It can perform problem determination on error codes, stacktraces, and logs. 
Red Hat Access: Analyze can perform log-file analysis using Red Hat servers.

# Logs as source of data for machine learning
##### Pulse
Learns from log files and searches for anomalies.
https://github.com/gophergala2016/Pulse

##### Entropy
Uses natural language processing for parsing logs.
https://github.com/jbowles/entropy

##### CLUEBOX: A Performance Log Analyzer for Automated Troubleshooting
Uses machine learning and logs for automated troubleshooting of performance problems.
https://www.usenix.org/legacy/event/wasl08/tech/full_papers/sandeep/sandeep_html/

##### Automatic Log Analysis using Machine Learning
Applies machine learning techniques to do automated log analysis. Compares several variants of clustering, artificial neural network algorithms and data preprocessing. 
http://uu.diva-portal.org/smash/get/diva2:667650/FULLTEXT01.pdf



Bibliography
--------------------------
[src1] http://www.psi.toronto.edu/affinitypropagation/FreyDueckScience07.pdf 

[src4] https://github.com/nvbn/thefuck

[src3] http://research.microsoft.com/apps/pubs/default.aspx?id=81176

[src5] http://uu.diva-portal.org/smash/get/diva2:667650/FULLTEXT01.pdf

[src6] https://www.youtube.com/watch?v=P-LEH-AFovE

[src7] http://arxiv.org/pdf/1507.07998v1.pdf

[src8] https://dl.acm.org/citation.cfm?id=1148241&dl=ACM&coll=DL&CFID=759388251&CFTOKEN=72271786

[src9] http://arxiv.org/pdf/1405.4053v2.pdf

[src10] http://arxiv.org/pdf/1507.07998v1.pdf
