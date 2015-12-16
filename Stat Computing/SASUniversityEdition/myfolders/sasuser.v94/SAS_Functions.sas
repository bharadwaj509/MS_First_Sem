DATA Test1;

x=10;
y=20;
z=30;
m=std(x,y,z);

RUN;
PROC PRint DATA=Test1;
RUN;
