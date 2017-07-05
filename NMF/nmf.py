import numpy as np
from scipy import misc
from tqdm import trange

target = misc.imread('../images/lenna.png', True) / 255.0
misc.imsave('./output/target.png', target)

# Iterative method (Lee and Seung [1999])
a = np.random.rand(target.shape[0], 1)
b = np.random.rand(target.shape[1], 1)

for i in trange(10):
    a = a * (target @ b) / (a @ b.T @ b)
    b = b * (target.T @ a) / (b @ a.T @ a)

misc.imsave('./output/output_iterative.png', a @ b.T)
misc.imsave('./output/a_iterative.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_iterative.png', np.ones(a.shape) @ b.T)

# Eigenvector method
H1 = target @ target.T
H2 = target.T @ target

eigenvalues, eigenvectors = np.linalg.eigh(H1)
a = eigenvectors[:,-1][np.newaxis].T

eigenvalues, eigenvectors = np.linalg.eigh(H2)
b = eigenvectors[:,-1][np.newaxis].T

misc.imsave('./output/H1.png', H1)
misc.imsave('./output/H2.png', H2)

misc.imsave('./output/output_eigenvector.png', a @ b.T)
misc.imsave('./output/a_eigenvector.png', a @ np.ones(b.shape).T)
misc.imsave('./output/b_eigenvector.png', np.ones(a.shape) @ b.T)