DATA ONE;
INPUT NAME$ @@;
LABEL NAME=student_name;
TITLE Survey Data;
Title2 FROM NJ;
DROP stundet_name;
CARDS;
John Jefferey Tom
Mike Andrews k
;
RUN;

PROC PRINT DATA=ONE LABEL;
RUN;

DATA football;
input team $ score @@;
CARDS;
cincinnati 18 UOhio 27 UOhio 39
Cincinnati 16 Cincinnati 29 UOhio 42
;
RUN;
PROC sort Data=football;
by team;
RUN;
PROC univariate data=football;
by team;
var score;
run;
DATA clinic;
input type $ score @@;
LABEL type=drug or placebo;
LABEL score=health score;
CARDS;
drug 8 drug 10 placebo 5 
drug 9 drug 9 placebo 7 placebo 6 placebo 6
;
RUN;
PROC sort Data=clinic;
by type;
RUN;
PROC means data=clinic;
by type;
var score;
run;

