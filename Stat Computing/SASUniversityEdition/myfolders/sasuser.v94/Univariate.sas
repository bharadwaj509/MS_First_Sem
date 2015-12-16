DATA FOOTBALL;
INPUT TEAM $ SCORE @@;
CARDS;
Cincinnati 18 UOhio 27 UOhio 39
Cincinnati 16 Cincinnati 29 UOhio 42
;
RUN;
PROC SORT DATA=FOOTBALL;
BY TEAM; /*data has to be sorted first if BY statement is used*/
RUN; /*in PROC UNIVARIATE*/
PROC UNIVARIATE DATA=FOOTBALL;
BY TEAM; /* tells SAS to sort data by TEAM*/
VAR SCORE; /* tells SAS to produce statistics of SCORE*/
RUN;