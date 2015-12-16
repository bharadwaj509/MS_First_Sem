N = input('number of points: '); 

[data, x, y]=gen_sigmoid_classes(N);

% plot classes
plot2dimdata(data(:,1:2), data(:,3), 'b+', 'go')
hold on;

% plot class boundary
for k=1:1000, plot(x(k), y(k), '-r'); hold on; end

%train perceptron
eta = input('eta: ');
error = input('error: ');
iterations = input('iterations: ');
[w, iter, e] = per(data(:, 1:2), data(:, 3), eta, error, iterations);
 x2 = -w(1)/w(2)*data(:,1) -w(3)/w(2);
  plot(data(:,1)', x2, 'k-');
 [w, e]