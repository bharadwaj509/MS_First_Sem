function y = backpropagation(X,Target, L,eta,alpha, errorbound, epochsbound)
% INVOKE: 
% y = backpropagation(X,Target, L,eta,alpha, errorbound, epochsbound)
% 
% Implements backprop where backpropagation training is done per epoch;
%  three layers feed forward  neural network.
%   
% It returns y the network which has the structure as follows:
%     S: a vector of number of nodes at each layer
%     W - a cell array specifiying the final weight matrices computed
%     E - the epochs required for training
%     MSE - the mean squared error at termination
%   
% Input:
%    Layers - a vector of integers specifying the number of nodes at each
%    layer, i.e for all i, 
%    Layers(i) = number of nodes at layer i, there must be (at least/exactly) three layers and the input layer 
%    Layers(1) equals the dimension of an input vector;
%    Layers(end) equals the dimension of each vector in Target
%    Layers(2:end-1) are hidden layers; in general we will have ONLY ONE
%    HIDDEN LAYER

%     eta - training rate for network learning [0.1 - 0.9]
%     alpha - momentum for the weight update rule [0.0 - 0.9]
%     errorbound - the mse at which to terminate computation
%     
%     The training samples, X, is a P-by-N matrix, where each X(p,:) is
%     a training vector of dimension N.
%
%    Target - the Target outputs, a P-by-M matrix where each Target[p]
%      is the Target output for the corresponding input Input[p]
%      Target(p) is a vectore of dimension M
%   epochsbound: bound on the number of epochs
%   W is a cell array;  weight matrices obtained from  
%   minimizing the mean squared error between the Target and network output 
%   based on the training examples X and the errorbound 
%
%   squashing functions:
%   Sigmoid: sigma(x) = 1/(1+ e^(-x))
%   Hyperbolic tangent:
%   ht(x) = 2/(1+e^(-x)) - 1  (for bipolar data)
%   
%  

% Is problem well defined?
% Determine sizes of X and Target
[P,N] = size(X);
[Pt,M] = size(Target);

% P and Pt must be equal : each input vector has a corresponding Target output
if P ~= Pt
    error('invalid backpropagation', ...
          'inputs != targets');
end

% Network has three layers: input - hidden - output
if length(L) < 3 
    error('backprop:invalidNetworkStructure','The network must have at least 3 layers');
else
    if N ~= L(1) || M ~= L(end)
        error('backpropagation:invalid Layer Size', e);
    elseif M ~= L(end)
        error('backprop:invalidLayerSize', e);    
    end
end

%  Network initialization 

numlayers = length(L); 

% Initialize weights: random values  U[-1 1], 
% Weight matrix between each layer of nodes. 
% The input layer and hidden layer have a bias node: weight is 0 corresponding to input 1
% There is a link from each node in layer i to the bias node in layer j 
% (the last row of each matrix): it is more efficient 
%  The  weights of all links to bias nodes are irrelevant and are defined as 0

w = cell(numlayers-1,1); % a weight matrix for each layer
for i=1:numlayers-2   
    [L(i+1) L(i)+1]
    1 - 2.*rand(L(i+1),L(i)+1) % matrix for each pair of layers
    w{i} = [1 - 2.*rand(L(i+1),L(i)+1) ; zeros(1,L(i)+1)]
end
w{end} = 1 - 2.*rand(L(end),L(end-1)+1);

% initialize stopping conditions
err = Inf;  % assuming the intial weight matrices are bad
epochs = 0;


% Activation: activation matrix a{i} for layer i 
% a{1} = the network input and 
% a{end} = network output
% a{i} is a  P x K_i (P: number of data points,K_i: nodes at layer i) matrix such that 
% a{i}(j): activation vector for the jth input of layer i; 
% a{i}(j,k) is the activation(output) of the kth node in layer i for the jth 
% input

a = cell(numlayers,1);  % one activation matrix for each layer
a{1} = [X ones(P,1)]; % a{1} is the input + '1' for the bias node activation
                      % a{1} remains the same throught the computation
for i=2:numlayers-1
    a{i} = ones(P,L(i)+1); % inner layers include a bias node (P-by-Nodes+1) 
end
a{end} = ones(P,L(end));   % no bias node at output layer

% Net matrix: net{i} for layer i (not including the input layer): P x K
% matrix
%  net{i} is computed as dot product:
%  net{i}= sum(w(i,j) * a(j)) for j = i-1
%  net{i}(j)  =  net vector at layer i for the jth data point
%  net{i}(j,k) =  net input at node k of the ith layer for the jth sample

net = cell(numlayers-1,1);
for i=1:numlayers-2;
    net{i} = ones(P,L(i+1)+1); % extend with the bias node 
end
net{end} = ones(P,L(end));

% Define:
% prev_deltaw : delta weight P x K_i matrices at step (t-1) 
% sum_deltaw: sum of the delta weights for each presentation of the input
% prev_deltaw{i}: delta weight matrix for all samples at step (t-1);
% sum_deltaw{i} : the sum of the weight matrix at layer i for all
% datapoints

prev_deltaw = cell(numlayers-1,1);
sum_deltaw = cell(numlayers-1,1);
for i=1:numlayers-1
    prev_deltaw{i} = zeros(size(w{i})); % initialize prev_deltaw to 0
    sum_deltaw{i} = zeros(size(w{i}));
end    

% loop while epochs less than bound on epochs && error > errorbound

while err > errorbound && epochs < epochsbound
    % FEEDFORWARD: propagate input through each layer for all data points
    
    for i=1:numlayers-1
        net{i} = a{i} * w{i}'; % compute inputs to current layer
        
        % compute activation(output of current layer, for all layers
        % exclusive the output, the last node is the bias node and
        % its activation is 1
        if i < numlayers-1 % inner layers
            %a{i+1} = [2./(1+exp(-net{i}(:,1:end-1)))-1 ones(P,1)]; %tanh
            a{i+1} = [1./(1+exp(-net{i}(:,1:end-1))) ones(P,1)];  % sigmoid
        else             % output layers
            a{i+1} = 1./(1+exp(-net{i})); 
        end
    end
    
    % calculate sum squared error of all samples
    err = (Target-a{end});       % save this for later
    sumsquarederror = sum(sum(err.^2)); % sum of the error for all samples, and all nodes
    
    % BACKPROPAGATION PHASE: 
    % For the sigmoid function this is error*sigma'(O)= O(1-O);
    % For the tanh this tanh'(O) = (1+O)*(1-O)
    % 
    % Start with the output nodes:
    % 	Calculate the sum of the weight matrices for all samples: 
    %   eta * O(1-O)*(Target - O)*x
    % 
    % Backpropagate the error such that the modified error for this
    % layer is: O(1-O)*(Activation) * ModifiedError * weight matrix
   
    delta = err .* a{end}.* (1 - a{end});

    for i=numlayers-1:-1:1
        sum_deltaw{i} = eta * delta' * a{i};
        if i > 1
            delta = a{i} .* (1-a{i}) .* (delta*w{i});
        end
    end
    
    % update the prev_w, weight matrices, epoch count and error
    for i=1:numlayers-1
        % we have the sum of the delta weights, divide through by the 
        % number of samples and add momentum * delta weight at (t-1)
        % finally, update the weight matrices
        prev_deltaw{i} = (sum_deltaw{i} ./ P) + (alpha * prev_deltaw{i});
        w{i} = w{i} + prev_deltaw{i};
    end   
    epochs = epochs + 1;
    err = sumsquarederror/(P*M); % = 1/P * 1/M * summed squared error
end

% return the trained network
y.S = L;
y.W = w;
y.E = epochs;
y.MSE = err;