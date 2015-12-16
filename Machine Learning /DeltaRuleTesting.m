function y=DeltaRuleTesting(DataPoint, w)
%% Invoke as: y = DeltaRuleTesting(DataPoint, w)
%% Computes the output for DataPoint given a weight vector trained by
%% DeltaRuleTraining
%% Input:
%%  DataPoint is a vector 1 x cd
%%  
%%  w is a vector of dimension P+1 x 1, where w_i is the weight for dimension i of a data point,
%%     for i=1:P, extended with weight w0 for the bias (input = 1).
%% Output: the label/classification for DataPoint

ld=length(DataPoint);
lw=length(w);
if lw ~= ld+1
    error('dimensions of the extended data and w do not agree');
else
     temp = sum(w .* [DataPoint,1]);  % dotproduct
      %for delta rule 
      y= temp;
     % for perceptron:
% % %      if temp < 0
% % %          y=-1;
% % %      else
% % %          y=+1;
% % %      end %%%% perceptron
end