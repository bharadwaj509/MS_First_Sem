DATA clinical_trail;
X="Placebo";
DO i = 1 TO 200; 			     /*200 observations */
Y = rand("normal",0,1);;
OUTPUT;
END;
X="Drug";
DO i = 1 TO 200; 			     /*200 observations */
Y = rand("normal",1,1);;
OUTPUT;
END;
RUN;
PROC print DATA=clinical_trail;
RUN;
PROC chart DATA=clinical_trail;
vbar Y/ subgroup=X;
RUN;
DATA placebo;
SET clinical_trail;
IF X='Placebo';
PROC chart DATA=clinical_trail;
vbar Y/subgroup=X midpoints=-4 to 4 by 1;
RUN;
DATA placeo;
SET clinical_trail;
PROC ttest DATA=clinical_trail;
class X;
var Y;
RUN;

