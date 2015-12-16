
data Unif(keep=X1 X2 Y Y_bin count);
alpha=1;
beta1=2;
beta2=-1.5;

do i = 1 to 200;
   u = rand("Uniform");      /*U(0,1)*/
   X1 = 1 + (4-1)*u;        /*Given X1 ~ (1,4)   */
   X2 = 3 + (1-3)*u;        /*Given X2 ~ (3,1)    */
   noise=rand("Uniform");   /*Given noise ~ N(0,1)*/
   Y = alpha+beta1*X1+beta2*X2+noise;
   if(Y>0)then Y_bin=1;
   ELSE Y_bin=0;
   
   if(Y_bin=1) then count=count+1;
output;
end;
RUN;
proc print data=Unif;
run;