DATA LinearSimulation(keep=X1 X2 Y Y_bin);
TITLE Simulation;
alpha=1;
beta1=2;
beta2=-1.5;
DO i = 1 TO 200; 			 /*200 observations */
   UnifVals = rand("Uniform");      /*U(0,1)*/
   X1 = 1 + (4-1)*UnifVals;        /*Given X1 ~ (1,4)   */
   X2 = 3 + (1-3)*UnifVals;        /*Given X2 ~ (3,1)    */
   noise=UnifVals;                 /*Given noise ~ N(0,1)*/
   Y = alpha+beta1*X1+beta2*X2+noise;
   if(Y>0)then Y_bin=1;
   ELSE Y_bin=0;
   
OUTPUT;
END;
RUN;
PROC MEANS DATA=LinearSimulation RANGE;
VAR X1 X2;
proc univariate;
VAR Y;
HISTOGRAM Y / NORMAL; 
PROBPLOT Y / NORMAL;
   run;
PROC PRINT DATA=LinearSimulation LABEL;
RUN;

DATA YBinCount;
SET LinearSimulation;
PROC FREQ DATA=YBinCount;
TABLE Y_bin;
RUN;
DATA CreateSign;
SET LinearSimulation;
if(Y_bin)then sign="Positive";
ELSE sign="Negative";
RUN;
PROC PRINT Data=CreateSign;
RUN;
DATA PositiveNegativeDist;
SET CreateSign;
RUN;
PROC SORT DATA=CreateSign;
BY sign; 
RUN; /*in PROC UNIVARIATE*/
PROC UNIVARIATE DATA=CreateSign;
BY sign; /* tells SAS to sort data by SIGN*/
VAR X1; /* tells SAS to produce statistics of X1*/
RUN;



