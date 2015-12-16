function data=gen_sigmoid_curve(N)
%% data=gen_sigmoid_curve(N)
%% generates N points on the curve y=sin(pi*x)

u=rand(1,N);
x=(2*u-1)';
y=sin(pi*x);
data=[x, y];

