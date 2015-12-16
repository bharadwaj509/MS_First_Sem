DATA FOOTBALL;
INPUT TEAM $ SCORE value@@;
CARDS;
Cincinnati 18 12 UOhio 27 12 UOhio 39 12
Cincinnati 16 11 Cincinnati 29 11 UOhio 42 11
;
RUN;
PROC SORT DATA=FOOTBALL;
BY TEAM; /*data has to be sorted first if BY statement is used*/
RUN; /*in PROC UNIVARIATE*/
PROC UNIVARIATE DATA=FOOTBALL;
BY TEAM; /* tells SAS to sort data by TEAM*/
VAR value;
VAR SCORE ; /* tells SAS to produce statistics of SCORE*/
RUN;