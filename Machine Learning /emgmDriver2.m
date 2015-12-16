clear all; clc; close all;
load data;
who
size(x)
k = input('number of Gaussians, 2, 3, 4: ')
%k=4; 
plot(x(1,:), x(2,:), '*');
title('initial data plot');
 [label, model, llh] = emgm2(x, k);
  ulabels = unique(label);
for l=1:k,
       data{l} = find(label == l);
end
figure; hold on;
if k==2
       plot(x(1, data{1}), x(2,data{1}), 'r*');
       plot(x(1, data{2}), x(2,data{2}), 'g*');
       title('Two Gaussians');
elseif k == 3
       plot(x(1, data{1}), x(2,data{1}), 'r*');
       plot(x(1, data{2}), x(2,data{2}), 'g*');
       plot(x(1, data{3}), x(2,data{3}), 'c*');
       title('Three Gaussians')
elseif k == 4
        plot(x(1, data{1}), x(2,data{1}), 'r*');
       plot(x(1, data{2}), x(2,data{2}), 'g*');
       plot(x(1, data{3}), x(2,data{3}), 'c*');
       plot(x(1, data{4}), x(2,data{4}), 'k*');
       title('Four Gaussians')
else
    disp('error');

end

