clear all;
% load('toydatax');
% load('toydatay');
% Target = toydatay';
% [P,N] = size(toydatax)
% [PT, M] = size(Target)

%% SECOND EXAMPLE
% x = [1 0 0 0 0 0 0 0; 
%     0 1 0 0 0 0 0 0; 
% 0 0 1 0 0 0 0 0]; 
% % 0 0 0 1 0 0 0 0; 
% % 0 0 0 0 1 0 0 0; 
% % 0 0 0 0 0 1 0 0]; 
% %0 0 0 0 0 0 1 0; 
% %0 0 0 0 0 0 0 1];
% 
% y=[1 0 0 0 0 0 0 0;
%   0 1 0 0 0 0 0 0;
%   0 0 1 0 0 0 0 0];
% %   0 0 0 1 0 0 0 0;
% %   0 0 0 0 1 0 0 0;
% %   0 0 0 0 0 1 0 0];
%  % 0 0 0 0 0 0 1 0; 
%  % 0 0 0 0 0 0 0 1];
% [P,N]=size(x);
% [PT, M]=size(y);
% P, N, PT, M
% toydatax = x;
% Target = y;


%3rd example
toydatax = [0 0; 1 0;  1 1];
Target = [0 0; 1 0 ; 1 1];
[P,N] = size(toydatax)
[PT, M] = size(Target)
L = [N, 1, M]
eta = 0.01;
alpha = 0.1;
errorbound = 0.01;
epochsbound = 10^5;
z = backpropagation(toydatax,Target, L,eta,alpha, errorbound, epochsbound);
