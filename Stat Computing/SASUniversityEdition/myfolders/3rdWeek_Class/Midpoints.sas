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
PROC chart DATA=LinearSimulation;
vbar X1 / subgroup=Y_bin midpoints=-6 to 6 by 1;
RUN;