function data=gen_sigmoid_classes(N)
%% data=gen_sigmoid_classes(N)
%% generates N points  in R^2 +1 or -1 according to whether they lie 
%% above or belos the curve y = sin(pi*x)

u=rand(2,N);
x=(2*u-1)';
y=sin(pi*x(:,1));
data=[x(:,1), x(:,2), sign(x(:,2)-y)];

